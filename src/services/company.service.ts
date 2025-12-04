import { Pool } from 'pg';
import { Company, CreateCompanyInput, UpdateCompanyInput, Pagination } from '../models/entities';
import { CompanyRepository } from '../repositories/company.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CustomFieldDefinitionRepository } from '../repositories/custom-field-definition.repository';
import { validateData, createCompanySchema, updateCompanySchema } from '../validation/schemas';
import { validateCustomFields } from '../validation/custom-fields';
import { AuditHelper } from '../utils/audit';
import { ValidationError } from '../errors';

export class CompanyService {
    private companyRepository: CompanyRepository;
    private auditLogRepository: AuditLogRepository;
    private customFieldRepository: CustomFieldDefinitionRepository;
    private auditHelper: AuditHelper;

    constructor(pool: Pool) {
        this.companyRepository = new CompanyRepository(pool);
        this.auditLogRepository = new AuditLogRepository(pool);
        this.customFieldRepository = new CustomFieldDefinitionRepository(pool);
        this.auditHelper = new AuditHelper(this.auditLogRepository);
    }

    async createCompany(data: CreateCompanyInput, userId: string): Promise<Company> {
        const validatedData = validateData(createCompanySchema, data) as CreateCompanyInput;

        if (validatedData.customFields && Object.keys(validatedData.customFields).length > 0) {
            const customFieldDefs = await this.customFieldRepository.findByEntityType('company');
            validateCustomFields(customFieldDefs, validatedData.customFields);
        }

        const company = await this.companyRepository.create(validatedData, userId);
        await this.auditHelper.logCreate('company', company.id, userId, company);

        return company;
    }

    async getCompany(id: string): Promise<Company> {
        const company = await this.companyRepository.findById(id);

        if (!company) {
            throw new ValidationError('Company not found', { id: ['Company does not exist'] });
        }

        return company;
    }

    async listCompanies(filters?: Record<string, any>, pagination?: Pagination): Promise<Company[]> {
        return this.companyRepository.findAll(filters, pagination);
    }

    async updateCompany(id: string, data: UpdateCompanyInput, userId: string): Promise<Company> {
        const validatedData = validateData(updateCompanySchema, data);

        const existingCompany = await this.companyRepository.findById(id);
        if (!existingCompany) {
            throw new ValidationError('Company not found', { id: ['Company does not exist'] });
        }

        if (validatedData.customFields && Object.keys(validatedData.customFields).length > 0) {
            const customFieldDefs = await this.customFieldRepository.findByEntityType('company');
            validateCustomFields(customFieldDefs, validatedData.customFields);
        }

        const updatedCompany = await this.companyRepository.update(id, validatedData, userId);
        await this.auditHelper.logUpdate('company', id, userId, existingCompany, updatedCompany);

        return updatedCompany;
    }

    async deleteCompany(id: string, userId: string): Promise<void> {
        const existingCompany = await this.companyRepository.findById(id);
        if (!existingCompany) {
            throw new ValidationError('Company not found', { id: ['Company does not exist'] });
        }

        await this.companyRepository.delete(id, userId);
        await this.auditHelper.logDelete('company', id, userId, existingCompany);
    }
}
