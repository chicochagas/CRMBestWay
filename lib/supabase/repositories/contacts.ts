import type { DbClient } from '../server';
import type { Tables } from '../types';
import { DomainError } from '@/lib/services/errors';
import { check, checkMaybe, sanitizeSearch, toDomainError, checkOk } from './errors';
import { mapContact } from './mappers';
import type { ContactWithCompany, ContactsRepo, NewContact } from './types';

const SELECT_WITH_COMPANY = '*, company:companies(id, name)';
type RowWithCompany = Tables<'contacts'> & { company: { id: string; name: string } | null };

function mapWithCompany(row: RowWithCompany): ContactWithCompany {
  return { ...mapContact(row), company: row.company };
}

function emailTaken(): DomainError {
  return new DomainError('CONTACT_EMAIL_TAKEN', 'Já existe um contato com este e-mail.', { field: 'email' });
}

function toRow(input: Partial<NewContact>) {
  const row: Partial<Tables<'contacts'>> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.email !== undefined) row.email = input.email;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.companyId !== undefined) row.company_id = input.companyId;
  if (input.origem !== undefined) row.origem = input.origem;
  return row;
}

export function createContactsRepo(db: DbClient): ContactsRepo {
  return {
    async insert(input) {
      const { data, error } = await db
        .from('contacts')
        .insert({
          name: input.name,
          email: input.email,
          phone: input.phone,
          company_id: input.companyId,
          origem: input.origem,
        })
        .select()
        .single();
      if (error) throw error.code === '23505' ? emailTaken() : toDomainError(error);
      return mapContact(data);
    },

    async update(id, patch) {
      const { error } = await db.from('contacts').update(toRow(patch)).eq('id', id);
      if (error) throw error.code === '23505' ? emailTaken() : toDomainError(error);
    },

    async getById(id) {
      const row = checkMaybe(await db.from('contacts').select(SELECT_WITH_COMPANY).eq('id', id).maybeSingle());
      return row ? mapWithCompany(row as unknown as RowWithCompany) : null;
    },

    async findByEmail(email) {
      const row = checkMaybe(await db.from('contacts').select('*').eq('email', email).maybeSingle());
      return row ? mapContact(row) : null;
    },

    async delete(id) {
      checkOk(await db.from('contacts').delete().eq('id', id));
    },

    async countDeals(contactId) {
      const { count, error } = await db
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('contact_id', contactId);
      if (error) throw toDomainError(error);
      return count ?? 0;
    },

    async search(q) {
      const term = sanitizeSearch(q);
      let query = db.from('contacts').select(SELECT_WITH_COMPANY).order('name').limit(50);
      if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
      const rows = check(await query);
      return (rows as unknown as RowWithCompany[]).map(mapWithCompany);
    },

    async listByCompany(companyId) {
      const rows = check(await db.from('contacts').select('*').eq('company_id', companyId).order('name'));
      return rows.map(mapContact);
    },
  };
}
