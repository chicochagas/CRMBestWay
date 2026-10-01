import { describe, expect, it } from 'vitest';
import { createContact, deleteContact } from '@/lib/services/contacts/contacts';
import { createLead } from '@/lib/services/leads/createLead';
import { normalizePhone } from '@/lib/validation/contact';
import { createFakeRepos, createStore, makeContact, makeDeal, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

const deal = { title: 'Lead', value: 0, nextAction: 'Ligar', nextActionDate: '2026-10-01' };

describe('createContact', () => {
  it('normaliza o e-mail e usa origem outbound por padrão', async () => {
    const store = createStore();
    const { id } = await createContact({ repos: createFakeRepos(store) }, { name: 'Ana', email: '  Ana@X.com ' });
    expect(store.contacts.find((c) => c.id === id)).toMatchObject({ email: 'ana@x.com', origem: 'outbound' });
  });

  it('e-mail duplicado (maiúsculas diferentes) devolve o contato existente (US3-3)', async () => {
    const store = createStore();
    const existing = makeContact({ email: 'ana@x.com' });
    store.contacts.push(existing);
    await expect(
      createContact({ repos: createFakeRepos(store) }, { name: 'Ana 2', email: 'ANA@x.com' }),
    ).rejects.toMatchObject({ code: 'CONTACT_EMAIL_TAKEN', meta: { existingId: existing.id } });
  });
});

describe('deleteContact', () => {
  it('bloqueia contato com deals (FR-008)', async () => {
    const store = createStore();
    const contact = makeContact();
    store.contacts.push(contact);
    store.deals.push(makeDeal({ contactId: contact.id }));
    await expectCode(deleteContact({ repos: createFakeRepos(store) }, { id: contact.id }), 'CONTACT_HAS_DEALS');
  });
});

describe('createLead', () => {
  it('cria empresa, contato e deal ligados (US3)', async () => {
    const store = createStore();
    const result = await createLead(
      { repos: createFakeRepos(store), viewer: VENDEDOR },
      { company: { name: 'Acme' }, contact: { name: 'Bia', email: 'bia@acme.com' }, deal },
    );
    expect(store.contacts[0]).toMatchObject({ id: result.contactId, companyId: result.companyId });
    expect(store.deals[0]).toMatchObject({ id: result.dealId, contactId: result.contactId, stageId: 's-novo' });
  });

  it('desfaz contato e empresa criados quando o deal falha', async () => {
    const store = createStore();
    await expectCode(
      createLead(
        { repos: createFakeRepos(store), viewer: VENDEDOR },
        { company: { name: 'Acme' }, contact: { name: 'Bia', email: 'bia@acme.com' }, deal: { ...deal, nextAction: '' } },
      ),
      'NEXT_ACTION_REQUIRED',
    );
    expect(store.contacts).toHaveLength(0);
    expect(store.companies).toHaveLength(0);
  });

  it('reaproveita contato existente sem recadastrar (US3-4)', async () => {
    const store = createStore();
    const contact = makeContact();
    store.contacts.push(contact);
    await createLead({ repos: createFakeRepos(store), viewer: VENDEDOR }, { contact: { id: contact.id }, deal });
    expect(store.contacts).toHaveLength(1);
    expect(store.deals[0]?.contactId).toBe(contact.id);
  });
});

describe('normalizePhone', () => {
  it('converte números brasileiros para E.164', () => {
    expect(normalizePhone('(11) 98765-4321')).toBe('+5511987654321');
    expect(normalizePhone('+1 415 555 0100')).toBe('+14155550100');
    expect(normalizePhone('   ')).toBeNull();
  });
});
