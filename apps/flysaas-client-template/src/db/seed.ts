/**
 * Database Seed Script
 * Populates database with sample data for testing
 */

import { Database } from 'bun:sqlite';

const DB_PATH = process.env.DB_PATH || './data/client.db';
const ORG_ID = process.env.ORG_ID || 'test-org';

async function seed() {
  const db = new Database(DB_PATH);

  console.log('🌱 Seeding database...');

  // Sample contacts
  const contacts = [
    {
      id: crypto.randomUUID(),
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0101',
      company: 'Acme Corp',
      title: 'CTO'
    },
    {
      id: crypto.randomUUID(),
      name: 'Jane Smith',
      email: 'jane@startup.io',
      phone: '+1-555-0102',
      company: 'StartupIO',
      title: 'CEO'
    },
    {
      id: crypto.randomUUID(),
      name: 'Bob Johnson',
      email: 'bob@techco.com',
      phone: '+1-555-0103',
      company: 'TechCo',
      title: 'VP Engineering'
    }
  ];

  for (const contact of contacts) {
    db.query(`
      INSERT INTO contacts (id, org_id, name, email, phone, company, title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(contact.id, ORG_ID, contact.name, contact.email, contact.phone, contact.company, contact.title);
  }

  console.log(`✅ Inserted ${contacts.length} contacts`);

  // Sample deals
  const deals = [
    {
      id: crypto.randomUUID(),
      contact_id: contacts[0].id,
      title: 'Enterprise Platform Deal',
      amount: 50000,
      stage: 'proposal',
      probability: 60
    },
    {
      id: crypto.randomUUID(),
      contact_id: contacts[1].id,
      title: 'Startup Package',
      amount: 15000,
      stage: 'negotiation',
      probability: 80
    },
    {
      id: crypto.randomUUID(),
      contact_id: contacts[2].id,
      title: 'Tech Integration',
      amount: 30000,
      stage: 'qualified',
      probability: 40
    }
  ];

  for (const deal of deals) {
    db.query(`
      INSERT INTO deals (id, org_id, contact_id, title, amount, stage, probability)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(deal.id, ORG_ID, deal.contact_id, deal.title, deal.amount, deal.stage, deal.probability);
  }

  console.log(`✅ Inserted ${deals.length} deals`);

  db.close();
  console.log('🎉 Database seeded successfully');
}

seed();
