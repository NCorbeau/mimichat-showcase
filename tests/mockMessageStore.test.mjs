import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MockMessageStore } from '../src/app/mockMessageStore.ts';

test('sending updates the active room and preview, and survives room switching', () => {
  const store = new MockMessageStore({
    launch: [{ id: 'first', text: 'Starting point' }],
    design: [{ id: 'design-first', text: 'Design review' }],
  });
  const roomSnapshots = [];
  const previews = [];
  const unsubscribeRoom = store.subscribe('launch', (messages) => roomSnapshots.push(messages));
  const unsubscribePreviews = store.subscribeLatest((latest) => previews.push(latest));

  assert.equal(store.add('launch', { id: 'second', text: 'Ready for review' }), true);
  assert.deepEqual(roomSnapshots.at(-1).map((message) => message.id), ['first', 'second']);
  assert.equal(previews.at(-1).get('launch').id, 'second');
  assert.equal(previews.at(-1).get('design').id, 'design-first');

  const designSnapshot = store.get('design');
  assert.deepEqual(designSnapshot.map((message) => message.id), ['design-first']);
  assert.deepEqual(store.get('launch').map((message) => message.id), ['first', 'second']);

  unsubscribeRoom();
  unsubscribePreviews();
});

test('duplicate sends and unsubscribed listeners do not create extra updates', () => {
  const store = new MockMessageStore({ launch: [] });
  let updates = 0;
  const unsubscribe = store.subscribe('launch', () => { updates += 1; });

  assert.equal(store.add('launch', { id: 'one' }), true);
  assert.equal(store.add('launch', { id: 'one' }), false);
  assert.equal(updates, 2); // Initial snapshot plus the first send.

  unsubscribe();
  store.add('launch', { id: 'two' });
  assert.equal(updates, 2);
  assert.deepEqual(store.get('launch').map((message) => message.id), ['one', 'two']);
  assert.equal(store.add('missing', { id: 'three' }), false);
});
