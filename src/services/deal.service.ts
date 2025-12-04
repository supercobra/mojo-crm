import { Pool } from 'pg';
import { Deal, CreateDealInput, UpdateDealInput, Pagination } from '../models/entities';
import { DealRepository } from '../repositories/deal.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CustomFieldDefinitionRepository } from '../repositories/custom-field-definition.repository';
import { validateData, createDealSchema, updateDealSchema } from '../validation/schemas';
import { validateCustomFields } from '../validation/custom-fields';
import { AuditHelper } from '../utils/audit';
import { ValidationError } from '../errors';

export class DealService {
    private dealRepository: DealRepository;
    private auditLogRepository: AuditLogRepository;
    private customFieldRepository: CustomFieldDefinitionRepository;
    private auditHelper: AuditHelper;

    constructor(pool: Pool) {
        this.dealRepository = new DealRepository(pool);
        this.auditLogRepository = new AuditLogRepository(pool);
        this.customFieldRepository = new CustomFieldDefinitionRepository(pool);
        this.auditHelper = new AuditHelper(this.auditLogRepository);
    }

    async createDeal(data: CreateDealInput, userId: string): Promise<Deal> {
        const validatedData = validateData(createDealSchema, data) as CreateDealInput;

        if (validatedData.customFields && Object.keys(validatedData.customFields).length > 0) {
            const customFieldDefs = await this.customFieldRepository.findByEntityType('deal');
            validateCustomFields(customFieldDefs, validatedData.customFields);
        }

        const deal = await this.dealRepository.create(validatedData, userId);
        await this.auditHelper.logCreate('deal', deal.id, userId, deal);

        return deal;
    }

    async getDeal(id: string): Promise<Deal> {
        const deal = await this.dealRepository.findById(id);

        if (!deal) {
            throw new ValidationError('Deal not found', { id: ['Deal does not exist'] });
        }

        return deal;
    }

    async listDeals(filters?: Record<string, any>, pagination?: Pagination): Promise<Deal[]> {
        return this.dealRepository.findAll(filters, pagination);
    }

    async getDealsByCompany(companyId: string): Promise<Deal[]> {
        return this.dealRepository.findByCompany(companyId);
    }

    async updateDeal(id: string, data: UpdateDealInput, userId: string): Promise<Deal> {
        const validatedData = validateData(updateDealSchema, data);

        const existingDeal = await this.dealRepository.findById(id);
        if (!existingDeal) {
            throw new ValidationError('Deal not found', { id: ['Deal does not exist'] });
        }

        if (validatedData.customFields && Object.keys(validatedData.customFields).length > 0) {
            const customFieldDefs = await this.customFieldRepository.findByEntityType('deal');
            validateCustomFields(customFieldDefs, validatedData.customFields);
        }

        const updatedDeal = await this.dealRepository.update(id, validatedData, userId);
        await this.auditHelper.logUpdate('deal', id, userId, existingDeal, updatedDeal);

        return updatedDeal;
    }

    async deleteDeal(id: string, userId: string): Promise<void> {
        const existingDeal = await this.dealRepository.findById(id);
        if (!existingDeal) {
            throw new ValidationError('Deal not found', { id: ['Deal does not exist'] });
        }

        await this.dealRepository.delete(id, userId);
        await this.auditHelper.logDelete('deal', id, userId, existingDeal);
    }
}
