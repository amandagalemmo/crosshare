#!/usr/bin/env -S NODE_OPTIONS='--loader ts-node/esm --experimental-specifier-resolution=node' npx ts-node-script

import { getFirestore } from 'firebase-admin/firestore';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { DonationsListV } from '../lib/dbtypes';
import { getAdminApp } from '../lib/firebaseAdminWrapper';

if (process.argv.length !== 3) {
  throw Error(
    'Invalid use of donationsForYear. Usage: ./scripts/donationsForYear.ts [year]'
  );
}

const db = getFirestore(getAdminApp());

async function getTotal() {
  const year = parseInt(process.argv[2] || '');
  console.log(`getting donations for ${year}`);
  const dbres = await db.doc(`donations/donations`).get();
  if (!dbres.exists) {
    console.error('no donations doc');
    return;
  }
  const validationResult = DonationsListV.decode(dbres.data());
  if (validationResult._tag !== 'Right') {
    console.error(PathReporter.report(validationResult).join(','));
    return;
  }
  const donations = validationResult.right;
  let total = 0;
  for (const donation of donations.d) {
    if (donation.d.toDate().getFullYear() === year) {
      total += donation.r;
    }
  }
  console.log(`total: ${total}`);
}

getTotal().then(() => {
  console.log('Done');
});
