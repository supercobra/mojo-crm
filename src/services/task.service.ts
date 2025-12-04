import { Pool } from 'pg';
import { Task, CreateTaskInput, UpdateTaskInput, Pagination } from '../models/entities';
import { TaskRepository } from '../repositories/task.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { validateData, createTaskSchema, updateTaskSchema } from '../validation/schemas';
import { AuditHelper } from '../utils/audit';
import { ValidationError } from '../errors';

export class TaskService {
    private taskRepository: TaskRepository;
    private auditLogRepository: AuditLogRepository;
    private auditHelper: AuditHelper;

    constructor(pool: Pool) {
        this.taskRepository = new TaskRepository(pool);
        this.auditLogRepository = new AuditLogRepository(pool);
        this.auditHelper = new AuditHelper(this.auditLogRepository);
    }

    async createTask(data: CreateTaskInput, userId: string): Promise<Task> {
        const validatedData = validateData(createTaskSchema, data) as CreateTaskInput;
        const task = await this.taskRepository.create(validatedData, userId);
        await this.auditHelper.logCreate('task', task.id, userId, task);
        return task;
    }

    async getTask(id: string): Promise<Task> {
        const task = await this.taskRepository.findById(id);

        if (!task) {
            throw new ValidationError('Task not found', { id: ['Task does not exist'] });
        }

        return task;
    }

    async listTasks(filters?: Record<string, any>, pagination?: Pagination): Promise<Task[]> {
        return this.taskRepository.findAll(filters, pagination);
    }

    async getTasksByEntity(entityType: string, entityId: string): Promise<Task[]> {
        return this.taskRepository.findByEntity(entityType, entityId);
    }

    async updateTask(id: string, data: UpdateTaskInput, userId: string): Promise<Task> {
        const validatedData = validateData(updateTaskSchema, data);

        const existingTask = await this.taskRepository.findById(id);
        if (!existingTask) {
            throw new ValidationError('Task not found', { id: ['Task does not exist'] });
        }

        const updatedTask = await this.taskRepository.update(id, validatedData, userId);
        await this.auditHelper.logUpdate('task', id, userId, existingTask, updatedTask);

        return updatedTask;
    }

    async deleteTask(id: string, userId: string): Promise<void> {
        const existingTask = await this.taskRepository.findById(id);
        if (!existingTask) {
            throw new ValidationError('Task not found', { id: ['Task does not exist'] });
        }

        await this.taskRepository.delete(id, userId);
        await this.auditHelper.logDelete('task', id, userId, existingTask);
    }
}
