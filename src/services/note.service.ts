import { Pool } from 'pg';
import { Note, CreateNoteInput, UpdateNoteInput, Pagination } from '../models/entities';
import { NoteRepository } from '../repositories/note.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { validateData, createNoteSchema, updateNoteSchema } from '../validation/schemas';
import { AuditHelper } from '../utils/audit';
import { ValidationError } from '../errors';

export class NoteService {
    private noteRepository: NoteRepository;
    private auditLogRepository: AuditLogRepository;
    private auditHelper: AuditHelper;

    constructor(pool: Pool) {
        this.noteRepository = new NoteRepository(pool);
        this.auditLogRepository = new AuditLogRepository(pool);
        this.auditHelper = new AuditHelper(this.auditLogRepository);
    }

    async createNote(data: CreateNoteInput, userId: string): Promise<Note> {
        const validatedData = validateData(createNoteSchema, data);
        const note = await this.noteRepository.create(validatedData, userId);
        await this.auditHelper.logCreate('note', note.id, userId, note);
        return note;
    }

    async getNote(id: string): Promise<Note> {
        const note = await this.noteRepository.findById(id);

        if (!note) {
            throw new ValidationError('Note not found', { id: ['Note does not exist'] });
        }

        return note;
    }

    async listNotes(filters?: Record<string, any>, pagination?: Pagination): Promise<Note[]> {
        return this.noteRepository.findAll(filters, pagination);
    }

    async getNotesByEntity(entityType: string, entityId: string): Promise<Note[]> {
        return this.noteRepository.findByEntity(entityType, entityId);
    }

    async updateNote(id: string, data: UpdateNoteInput, userId: string): Promise<Note> {
        const validatedData = validateData(updateNoteSchema, data);

        const existingNote = await this.noteRepository.findById(id);
        if (!existingNote) {
            throw new ValidationError('Note not found', { id: ['Note does not exist'] });
        }

        const updatedNote = await this.noteRepository.update(id, validatedData, userId);
        await this.auditHelper.logUpdate('note', id, userId, existingNote, updatedNote);

        return updatedNote;
    }

    async deleteNote(id: string, userId: string): Promise<void> {
        const existingNote = await this.noteRepository.findById(id);
        if (!existingNote) {
            throw new ValidationError('Note not found', { id: ['Note does not exist'] });
        }

        await this.noteRepository.delete(id, userId);
        await this.auditHelper.logDelete('note', id, userId, existingNote);
    }
}
