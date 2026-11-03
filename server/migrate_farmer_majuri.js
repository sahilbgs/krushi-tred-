/**
 * Database Migration Script
 * Fixes Farmer Purchase (ખેડૂત ખરીદી) records so that majuri (મજૂરી) is subtracted
 * from items_sub_total instead of added.
 * Also synchronizes party_transactions, rojmel, and party balances.
 */
import pg from 'pg';
import { recalculatePartyBalance } from './index.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://gtu_admin:password@127.0.0.1:5432/krushi_trade'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('=== STARTING FARMER PURCHASE MAJURI MIGRATION ===\n');
    await client.query('BEGIN');

    // 1. Fetch all farmer purchases
    const res = await client.query(`
      SELECT id, bill_no, purchase_date, party_id, party_name, purchase_type, items_sub_total, majuri_rate_per_bag, majuri_amount, total_expenses, net_total, paid_amount, due_amount
      FROM purchases
      WHERE purchase_type = 'farmer'
      ORDER BY bill_no ASC
    `);

    console.log(`Found ${res.rows.length} farmer purchases.\n`);
    const affectedPartyIds = new Set();

    for (const pur of res.rows) {
      const subTotal = parseFloat(pur.items_sub_total || 0);
      const majuri = parseFloat(pur.majuri_amount || 0);
      const paid = parseFloat(pur.paid_amount || 0);
      const oldNet = parseFloat(pur.net_total || 0);
      const oldDue = parseFloat(pur.due_amount || 0);

      // In farmer purchase: Net = SubTotal - Majuri
      const newNet = parseFloat(Math.max(0, subTotal - majuri).toFixed(2));
      const newDue = parseFloat(Math.max(0, newNet - paid).toFixed(2));

      console.log(`Bill: ${pur.bill_no} (${pur.party_name})`);
      console.log(`  SubTotal: ₹${subTotal}, Majuri: ₹${majuri}`);
      console.log(`  Old Net: ₹${oldNet} -> New Net: ₹${newNet} (Diff: ₹${(oldNet - newNet).toFixed(2)})`);
      console.log(`  Old Due: ₹${oldDue} -> New Due: ₹${newDue}`);

      // Update Purchases table
      await client.query(
        `UPDATE purchases
         SET net_total = $1, due_amount = $2, updated_at = NOW()
         WHERE id = $3`,
        [newNet, newDue, pur.id]
      );

      // Update Party Transactions
      const txRes = await client.query(
        `UPDATE party_transactions
         SET credit = $1
         WHERE (voucher_no = $2 OR bill_id = $3) AND voucher_type = 'purchase'
         RETURNING id`,
        [newNet, pur.bill_no, pur.id]
      );
      console.log(`  Updated ${txRes.rowCount} party_transaction records.`);

      // Update Rojmel
      const rojRes = await client.query(
        `UPDATE rojmel
         SET credit = $1
         WHERE voucher_no = $2 AND voucher_type = 'purchase'
         RETURNING id`,
        [paid > 0 ? 0 : newNet, pur.bill_no]
      );
      console.log(`  Updated ${rojRes.rowCount} rojmel records.\n`);

      if (pur.party_id) {
        affectedPartyIds.add(pur.party_id);
      }
    }

    // 2. Recalculate true balances for all affected parties
    console.log(`Recalculating balances for ${affectedPartyIds.size} parties...`);
    for (const partyId of affectedPartyIds) {
      const updatedParty = await recalculatePartyBalance(client, partyId);
      if (updatedParty) {
        console.log(`  Party: ${updatedParty.name} (${updatedParty.id}) => Balance: ₹${updatedParty.currentBalance} ${updatedParty.balanceType.toUpperCase()}`);
      }
    }

    await client.query('COMMIT');
    console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
