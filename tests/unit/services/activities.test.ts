import { describe, expect, it } from 'vitest';
import { addNote, getTimeline } from '@/lib/services/activities/activities';
import { createFakeRepos, createStore, makeContact, makeDeal, VENDEDOR } from '../fakes/repositories';
import { expectCode } from '../helpers';

function setup() {
  const store = createStore();
  const contact = makeContact();
  store.contacts.push(contact);
  const dealA = makeDeal({ contactId: contact.id });
  const dealB = makeDeal({ contactId: contact.id });
  store.deals.push(dealA, dealB);
  return { store, contact, dealA, dealB, ctx: { repos: createFakeRepos(store), viewer: VENDEDOR } };
}

describe('addNote', () => {
  it('com deal, preenche o contato do deal e o autor', async () => {
    const { ctx, store, dealA, contact } = setup();
    await addNote(ctx, { type: 'call_note', content: 'Call ótima', dealId: dealA.id });
    expect(store.activities[0]).toMatchObject({ type: 'call_note', dealId: dealA.id, contactId: contact.id });
    expect(store.activities[0]?.author?.id).toBe(VENDEDOR.id);
  });

  it('rejeita nota vazia ou longa demais', async () => {
    const { ctx, dealA } = setup();
    await expectCode(addNote(ctx, { type: 'note', content: '   ', dealId: dealA.id }), 'VALIDATION');
    await expectCode(addNote(ctx, { type: 'note', content: 'x'.repeat(5001), dealId: dealA.id }), 'VALIDATION');
  });
});

describe('getTimeline', () => {
  it('do contato combina as notas do contato e dos seus deals, mais recente primeiro (US5-3)', async () => {
    const { ctx, contact, dealA, dealB } = setup();
    await addNote(ctx, { type: 'note', content: '1', dealId: dealA.id });
    await addNote(ctx, { type: 'note', content: '2', contactId: contact.id });
    await addNote(ctx, { type: 'note', content: '3', dealId: dealB.id });

    const items = await getTimeline(ctx, { contactId: contact.id });
    expect(items.map((item) => item.content)).toEqual(['3', '2', '1']);

    const onlyDealA = await getTimeline(ctx, { dealId: dealA.id });
    expect(onlyDealA.map((item) => item.content)).toEqual(['1']);
  });
});
