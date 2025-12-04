import { Pool } from 'pg';
import { Contact, CreateContactInput, UpdateContactInput, Pagination } from '../models/entities';
import { ContactRepository } from '../repositories/contact.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CustomFieldDefinitionRepository } from '../repositories/custom-field-definition.repository';
import { validateData, createContactSchema, updateContactSchema } from '../validation/schemas';
import { validateCustomFields } from '../validation/custom-fields';
import { AuditHelper } from '../utils/audit';
import { ValidationError } from '../errors';

export class ContactService {
    private contactRepository: ContactRepository;
    private auditLogRepository: AuditLogRepository;
    private customFieldRepository: CustomFieldDefinitionRepository;
    private auditHelper: AuditHelper;

    constructor(pool: Pool) {
        this.contactRepository = new ContactRepository(pool);
        this.auditLogRepository = new AuditLogRepository(pool);
        this.customFieldRepository = new CustomFieldDefinitionRepository(pool);
        this.auditHelper = new AuditHelper(this.auditLogRepository);
    }

    async createContact(data: CreateContactInput, userId: string): Promise<Contact> {
        // Validate input
        const validatedData = validateData(createContactSchema, data);

        // Validate custom fields if provided
        if (validatedData.customFields && Object.keys(validatedData.customFields).length > 0) {
            const customFieldDefs = await this.customFieldRepository.findByEntityType('contact');
            validateCustomFields(customFieldDefs, validatedData.customFields);
        }

        // Create contact
        const contact = await this.contactRepository.create(validatedData, userId);

        // Log audit
        await this.auditHelper.logCreate('contact', contact.id, userId, contact);

        return contact;
    }

    async getContact(id: string): Promise<Contact> {
        const contact = await this.contactRepository.findById(id);

        if (!contact) {
            throw new ValidationError('Contact not found', { id: ['Contact does not exist'] });
        }

        return contact;
    }

    async listContacts(filters?: Record<string, any>, pagination?: Pagination): Promise<Contact[]> {
        return this.contactRepository.findAll(filters, pagination);
    }

    async getContactsByCompany(companyId: string): Promise<Contact[]> {
        return this.contactRepository.findByCompany(companyId);
    }

    async updateContact(id: string, data: UpdateContactInput, userId: string): Promise<Contact> {
        // Validate input
        const validatedData = validateData(updateContactSchema, data);

        // Get existing contact for audit
        const existingContact = await this.contactRepository.findById(id);
        if (!existingContact) {
            throw new ValidationError('Contact not found', { id: ['Contact does not exist'] });
        }

        // Validate custom fields if provided
        if (validatedData.customFields && Object.keys(validatedData.customFields).length > 0) {
            const customFieldDefs = await this.customFieldRepository.findByEntityType('contact');
            validateCustomFields(customFieldDefs, validatedData.customFields);
        }

        // Update contact
        const updatedContact = await this.contactRepository.update(id, validatedData, userId);

        // Log audit
        await this.auditHelper.logUpdate('contact', id, userId, existingContact, updatedContact);

        return updatedContact;
    }

    async deleteContact(id: string, userId: string): Promise<void> {
        // Get existing contact for audit
        const existingContact = await this.contactRepository.findById(id);
        if (!existingContact) {
            throw new ValidationError('Contact not found', { id: ['Contact does not exist'] });
        }

        // Delete contact
        await this.contactRepository.delete(id, userId);

        // Log audit
        await this.auditHelper.logDelete('contact', id, userId, existingContact);
    }
}
