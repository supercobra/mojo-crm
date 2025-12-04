/**
 * Example usage of the CRM core data models
 * This file demonstrates how to use the services and repositories
 */

import { getPool, closePool } from './config/database';
import { ContactService } from './services/contact.service';
import { CompanyService } from './services/company.service';
import { DealService } from './services/deal.service';

async function main() {
    const pool = getPool();
    const userId = 'example-user-123';

    try {
        // Initialize services
        const contactService = new ContactService(pool);
        const companyService = new CompanyService(pool);
        const dealService = new DealService(pool);

        // Create a company
        console.log('Creating company...');
        const company = await companyService.createCompany(
            {
                name: 'Acme Corporation',
                address: {
                    street: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94105',
                    country: 'USA'
                },
                customFields: {}
            },
            userId
        );
        console.log('Company created:', company.id);

        // Create a contact
        console.log('Creating contact...');
        const contact = await contactService.createContact(
            {
                firstName: 'John',
                lastName: 'Doe',
                emails: ['john.doe@acme.com'],
                phones: ['+1-555-0123'],
                companyId: company.id,
                customFields: {}
            },
            userId
        );
        console.log('Contact created:', contact.id);

        // Create a deal
        console.log('Creating deal...');
        const deal = await dealService.createDeal(
            {
                title: 'Enterprise Software License',
                companyId: company.id,
                contactId: contact.id,
                value: 50000,
                currency: 'USD',
                stage: 'Proposal',
                probability: 60,
                closeDate: new Date('2024-03-31'),
                customFields: {}
            },
            userId
        );
        console.log('Deal created:', deal.id);

        // List all contacts for the company
        console.log('Fetching contacts for company...');
        const companyContacts = await contactService.getContactsByCompany(company.id);
        console.log(`Found ${companyContacts.length} contacts`);

        // Update deal stage
        console.log('Updating deal stage...');
        const updatedDeal = await dealService.updateDeal(
            deal.id,
            { stage: 'Negotiation', probability: 75 },
            userId
        );
        console.log('Deal updated:', updatedDeal.stage);

        console.log('\nExample completed successfully!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closePool();
    }
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

export { main };
