import Groq from 'groq-sdk';
import { botState } from './bot-state';
import { buildCharacterPrompt } from './characters';
import type { WebContents } from 'electron';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));
const randomDelay = (min: number, max: number) =>
  sleep(Math.random() * (max - min) + min);

function getSelectors() {
  const s = botState.selectors;
  return { ...s };
}

function scriptGetChatList(): string {
  const s = getSelectors();
  const chatListStr = JSON.stringify(s.chatList || 'div[role="list"]');
  const chatItemStr = JSON.stringify(s.chatItem || '[role="listitem"]');
  return `
(function() {
  try {
    const list = document.querySelector(${chatListStr});
    if (!list) return { ok: false, items: [] };
    let items = list.querySelectorAll(${chatItemStr});
    if (!items.length && list.children && list.children.length) items = Array.from(list.children);
    const result = [];
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      var rect = el.getBoundingClientRect();
      // Skip the stories row (taller than regular chat items ~74px)
      if (rect.height > 90) continue;
      var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      if (ariaLabel.indexOf('story') >= 0 || ariaLabel.indexOf('stories') >= 0) continue;
      const unread = el.querySelector('[aria-label="Unread" i], [aria-label*="unread" i]');
      result.push({ index: i, text: (el.textContent || '').trim().slice(0, 60), isUnread: !!unread });
    }
    return { ok: true, items: result };
  } catch (e) { return { ok: false, items: [], error: e.message }; }
})();
`;
}

function scriptHighlightChat(chatName: string): string {
  const s = getSelectors();
  const chatListStr = JSON.stringify(s.chatList || 'div[role="list"]');
  const chatItemStr = JSON.stringify(s.chatItem || '[role="listitem"]');
  const nameStr = JSON.stringify(chatName);
  return `
(function() {
  try {
    document.querySelectorAll('[data-snapbot-highlight]').forEach(function(el) {
      el.style.removeProperty('background-color');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('transition');
      el.removeAttribute('data-snapbot-highlight');
    });
    const list = document.querySelector(${chatListStr});
    if (!list) return { ok: false };
    let items = list.querySelectorAll(${chatItemStr});
    if (!items.length && list.children && list.children.length) items = Array.from(list.children);
    var el = null;
    var target = ${nameStr};
    for (var i = 0; i < items.length; i++) {
      if ((items[i].textContent || '').trim().slice(0, 60).indexOf(target) === 0) { el = items[i]; break; }
    }
    if (!el) return { ok: false };
    el.setAttribute('data-snapbot-highlight', 'true');
    el.style.backgroundColor = 'rgba(147, 51, 234, 0.25)';
    el.style.boxShadow = 'inset 0 0 0 1px rgba(168, 85, 247, 0.4)';
    el.style.transition = 'background-color 0.3s ease, box-shadow 0.3s ease';
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

function scriptClearHighlight(): string {
  return `
(function() {
  try {
    document.querySelectorAll('[data-snapbot-highlight]').forEach(function(el) {
      el.style.removeProperty('background-color');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('transition');
      el.removeAttribute('data-snapbot-highlight');
    });
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

function scriptClickChatByName(chatName: string): string {
  const s = getSelectors();
  const chatListStr = JSON.stringify(s.chatList || 'div[role="list"]');
  const chatItemStr = JSON.stringify(s.chatItem || '[role="listitem"]');
  const nameStr = JSON.stringify(chatName);
  return `
(function() {
  try {
    const list = document.querySelector(${chatListStr});
    if (!list) return { ok: false };
    let items = list.querySelectorAll(${chatItemStr});
    if (!items.length && list.children && list.children.length) items = Array.from(list.children);
    var el = null;
    var target = ${nameStr};
    for (var i = 0; i < items.length; i++) {
      if ((items[i].textContent || '').trim().slice(0, 60).indexOf(target) === 0) { el = items[i]; break; }
    }
    if (!el) return { ok: false, error: 'chat not found in DOM' };
    (el.querySelector('[role="button"]') || el.querySelector('div:first-child') || el).click();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

export function scriptGetLastMessage(): string {
  const s = getSelectors();
  const portalStr = JSON.stringify(s.portal || '#portal-container');
  const msgStr = JSON.stringify(s.messageContent || 'div[dir="auto"]');
  return `
(function() {
  try {
    const root = document.querySelector(${portalStr}) || document.body;
    var lastEl = null;
    var list = null;
    var allUjRzj = document.body.querySelectorAll('ul.ujRzj');
    if (allUjRzj.length > 0) {
      list = allUjRzj[allUjRzj.length - 1];
      if (list.children && list.children.length > 0) {
        lastEl = list.children[list.children.length - 1];
      }
    }
    if (!lastEl) {
      list = root.querySelector('ul.ujRzj') || document.body.querySelector('ul.ujRzj');
      if (list && list.children && list.children.length > 0) {
        lastEl = list.children[list.children.length - 1];
      }
    }
    if (!lastEl) {
      var uls = document.body.querySelectorAll('ul');
      for (var u = uls.length - 1; u >= 0; u--) {
        if (uls[u].children && uls[u].children.length > 0) {
          lastEl = uls[u].children[uls[u].children.length - 1];
          break;
        }
      }
    }
    var lastText = '';
    var lastFromMe = false;
    if (lastEl) {
      var msgNodes = lastEl.querySelectorAll('span[dir="auto"], span.ogn1z, .p8r1z span, div[dir="auto"]');
      if (msgNodes.length > 0) {
        var parts = [];
        for (var m = 0; m < msgNodes.length; m++) {
          var t = (msgNodes[m].textContent || '').trim();
          if (t && t.toLowerCase() !== 'me') parts.push(t);
        }
        lastText = parts.join(' ').trim();
      }
      if (!lastText) lastText = (lastEl.textContent || '').trim().replace(/^Me\\s*/i, '').trim();
      if (lastText.length > 1000) lastText = lastText.slice(0, 1000);
      function liHasMe(li) {
        if (!li) return false;
        var h = li.querySelector ? li.querySelector('header') : null;
        if (h && (h.textContent || '').trim().toLowerCase().indexOf('me') === 0) return true;
        if (li.firstElementChild && li.firstElementChild.tagName === 'HEADER' && (li.firstElementChild.textContent || '').trim().toLowerCase().indexOf('me') === 0) return true;
        var sp = li.querySelector ? li.querySelector('span.nonIntl') : null;
        return sp && (sp.textContent || '').trim().toLowerCase() === 'me';
      }
      function liHasOtherHeader(li) {
        if (!li) return false;
        var h = li.querySelector ? li.querySelector('header') : null;
        if (h) {
          var t = (h.textContent || '').trim().toLowerCase();
          if (t && t.indexOf('me') !== 0) return true;
        }
        if (li.firstElementChild && li.firstElementChild.tagName === 'HEADER') {
          var t = (li.firstElementChild.textContent || '').trim().toLowerCase();
          if (t && t.indexOf('me') !== 0) return true;
        }
        return false;
      }
      var cur = lastEl;
      for (var back = 0; back < 25 && cur; back++) {
        if (liHasMe(cur)) { lastFromMe = true; break; }
        if (liHasOtherHeader(cur)) { lastFromMe = false; break; }
        cur = cur.previousElementSibling;
      }
      var lastIsSnapButton = lastEl.querySelector && lastEl.querySelector('button, [role="button"]');
      if (lastIsSnapButton || /new\\s*snap/i.test(lastText || '')) {
        var prevLi = lastEl.previousElementSibling;
        if (prevLi) {
          var pNodes = prevLi.querySelectorAll('span[dir="auto"], span.ogn1z, .p8r1z span, div[dir="auto"]');
          var prevTxt = '';
          if (pNodes.length > 0) {
            var pParts = [];
            for (var pn = 0; pn < pNodes.length; pn++) {
              var pt = (pNodes[pn].textContent || '').trim();
              if (pt && pt.toLowerCase() !== 'me') pParts.push(pt);
            }
            prevTxt = pParts.join(' ').trim();
          }
          if (!prevTxt) prevTxt = (prevLi.textContent || '').trim().replace(/^Me\\s*/i, '').trim();
          if (prevTxt.length > 1000) prevTxt = prevTxt.slice(0, 1000);
          if (prevTxt) {
            lastText = prevTxt;
            lastFromMe = false;
            cur = prevLi;
            for (var b2 = 0; b2 < 25 && cur; b2++) {
              if (liHasMe(cur)) { lastFromMe = true; break; }
              if (liHasOtherHeader(cur)) { lastFromMe = false; break; }
              cur = cur.previousElementSibling;
            }
          } else { lastFromMe = true; }
        } else { lastFromMe = true; }
      }
    }
    if (!lastText) {
      var nodes = document.body.querySelectorAll(${msgStr});
      if (nodes.length > 0) {
        lastEl = nodes[nodes.length - 1];
        lastText = (lastEl.textContent || '').trim().slice(0, 500);
      }
    }
    var recentMessages = [];
    if (list && list.children) {
      var maxItems = Math.min(list.children.length, 50);
      for (var i = 0; i < maxItems; i++) {
        var li = list.children[i];
        var fromMe = false;
        var h = li.querySelector ? li.querySelector('header') : null;
        if (h && (h.textContent || '').trim().toLowerCase().indexOf('me') === 0) fromMe = true;
        if (!fromMe && li.firstElementChild && li.firstElementChild.tagName === 'HEADER' && (li.firstElementChild.textContent || '').trim().toLowerCase().indexOf('me') === 0) fromMe = true;
        if (!fromMe && li.querySelector && li.querySelector('span.nonIntl') && (li.querySelector('span.nonIntl').textContent || '').trim().toLowerCase() === 'me') fromMe = true;
        var msgNodes = li.querySelectorAll ? li.querySelectorAll('span[dir="auto"], span.ogn1z, .p8r1z span, div[dir="auto"]') : [];
        var txt = '';
        if (msgNodes.length > 0) {
          var parts = [];
          for (var mn = 0; mn < msgNodes.length; mn++) {
            var mt = (msgNodes[mn].textContent || '').trim();
            if (mt && mt.toLowerCase() !== 'me') parts.push(mt);
          }
          txt = parts.join(' ').trim();
        }
        if (!txt) txt = (li.textContent || '').trim().replace(/^Me\\s*/i, '').trim();
        if (txt.length > 300) txt = txt.slice(0, 300);
        var isSnapButton = li.querySelector && li.querySelector('button, [role="button"]');
        if (txt && !/new\\s*snap/i.test(txt) && !isSnapButton) recentMessages.push({ fromMe: fromMe, text: txt });
      }
    }
    const main = root.querySelector('[role="main"]') || document.querySelector('main');
    const mainText = main ? (main.textContent || '').trim() : '';
    if (!lastText && mainText) lastText = mainText.slice(-300);
    const isNewChat = mainText.length < 50 || (!lastText && mainText.length < 200);
    const isNewSnap = mainText.toLowerCase().includes('snap') || mainText.toLowerCase().includes('view');
    return { ok: true, lastText: lastText || '', lastFromMe, isNewChat, isNewSnap, recentMessages: recentMessages, debug: { listFound: !!list, lastElTag: lastEl ? lastEl.tagName : null } };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

function scriptTypeInInput(text: string): string {
  const s = getSelectors();
  const escaped = JSON.stringify(String(text));
  const inputSels = (s.inputBox || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const inputSelsFinal =
    inputSels.length > 0
      ? inputSels
      : ['[contenteditable="true"]', '[role="textbox"]', 'textarea'];
  const inputSelStr = JSON.stringify(inputSelsFinal);
  const portalStr = JSON.stringify(s.portal || '#portal-container');
  return `
(function() {
  try {
    const root = document.querySelector(${portalStr}) || document.body;
    const inputSels = ${inputSelStr};
    let input = null;
    for (var i = 0; i < inputSels.length; i++) {
      input = root.querySelector(inputSels[i]) || document.querySelector(inputSels[i]);
      if (input) break;
    }
    if (!input) return { ok: false, error: 'no input' };
    input.focus();
    input.click();
    const text = ${escaped};
    if (input.contentEditable === 'true' || input.getAttribute('contenteditable') === 'true') {
      try { document.execCommand('insertText', false, text); } catch (e) {}
      if (!input.innerText || input.innerText.indexOf(text) < 0) {
        input.innerText = text;
        input.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      }
    } else {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

function scriptClickSend(): string {
  const s = getSelectors();
  const sendSels = (s.sendButton || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const sendSelsFinal =
    sendSels.length > 0
      ? sendSels
      : [
          'button[aria-label*="Send" i]',
          '[aria-label="Send"]',
          'button[type="submit"]',
        ];
  const sendSelStr = JSON.stringify(sendSelsFinal);
  const portalStr = JSON.stringify(s.portal || '#portal-container');
  return `
(function() {
  try {
    var root = document.querySelector(${portalStr}) || document.body;
    var sendSels = ${sendSelStr};
    var send = null;
    for (var j = 0; j < sendSels.length; j++) {
      try { send = root.querySelector(sendSels[j]) || document.querySelector(sendSels[j]); } catch (q) {}
      if (send) break;
    }
    if (!send) {
      var all = document.querySelectorAll('button, [role="button"], [type="submit"]');
      for (var k = 0; k < all.length; k++) {
        var el = all[k];
        var label = String((el.getAttribute && el.getAttribute('aria-label')) || el.textContent || '');
        if (/send/i.test(label)) { send = el; break; }
      }
    }
    if (!send) return { ok: false, error: 'no send' };
    send.click();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

const MAX_CONTEXT_CHARS = 3500;

// Global rule: keep replies reserved and natural, not AI-like
const RESERVED_RULE = `CRITICAL: Be reserved. Reply in 1 short sentence max—or a few words. Never write long paragraphs, multiple sentences, or enthusiastic AI-sounding text. Text like a real person: brief, casual, understated.`;

interface RecentMessage {
  fromMe: boolean;
  text: string;
}

function formatConversationContext(
  recentMessages: RecentMessage[] | undefined
): string {
  if (!recentMessages || !Array.isArray(recentMessages) || recentMessages.length === 0)
    return '';
  const lines = recentMessages
    .map((m) => (m.fromMe ? 'Me' : 'Them') + ': ' + (m.text || '').trim())
    .filter((s) => s.length > 2);
  let out = lines.join('\n');
  if (out.length > MAX_CONTEXT_CHARS) out = out.slice(-MAX_CONTEXT_CHARS);
  return out;
}

async function generateReply(
  incomingMessage: string,
  recentMessages: RecentMessage[]
): Promise<string> {
  const context = formatConversationContext(recentMessages);
  const baseInstructions =
    '"Me" is you; "Them" is the other person. Output ONLY the exact message to send - nothing else. No explanations, no meta-commentary. Just the reply.';
  const charPrompt =
    botState.characterEnabled && botState.characterConfig
      ? buildCharacterPrompt(botState.characterConfig)
      : null;
  const reservedRule = `\n\n${RESERVED_RULE}`;
  const systemPrompt = charPrompt
    ? `${charPrompt}${reservedRule}${context ? `\n\nChat:\n${context}\n\nReply to the last message only.` : ''}`
    : `You are replying in a chat app. ${baseInstructions}${reservedRule}${
        context ? `\n\nChat:\n${context}\n\nReply to the last message only.` : ''
      }`;
  const userPrompt = context
    ? `Last message from them: "${incomingMessage}"\n\nYour reply (message only):`
    : `They said: "${incomingMessage}"\n\nYour reply (message only):`;
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 50,
    temperature: 0.4,
  });
  return (completion.choices[0]?.message?.content || '').trim();
}

const cooldown = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;
let cycleRunning = false;
let botIntervalId: ReturnType<typeof setInterval> | null = null;

// (scrolling now handled by scanChatList + scriptScrollToPosition)

function scriptScrollToPosition(scrollTop: number): string {
  return `
(function() {
  try {
    var vList = document.querySelector('.ReactVirtualized__Grid.ReactVirtualized__List')
              || document.querySelector('[role="list"]');
    if (!vList) return { ok: false, error: 'no list' };
    vList.scrollTop = ${scrollTop};
    return { ok: true, scrollTop: vList.scrollTop, scrollHeight: vList.scrollHeight };
  } catch (e) { return { ok: false, error: e.message }; }
})();
`;
}

function scriptGetVisibleChats(): string {
  return `
(function() {
  try {
    var vList = document.querySelector('.ReactVirtualized__Grid.ReactVirtualized__List')
              || document.querySelector('[role="list"]');
    if (!vList) return { ok: false, items: [], error: 'no list' };
    var items = vList.querySelectorAll('[role="listitem"]');
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var text = (el.textContent || '').trim().slice(0, 60);
      var rect = el.getBoundingClientRect();
      // Skip the stories row: it's taller than regular chats (~100px vs ~74px)
      // and contains multiple user names mashed together
      if (rect.height > 90) continue;
      // Skip items with story-related aria labels
      var ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
      if (ariaLabel.indexOf('story') >= 0 || ariaLabel.indexOf('stories') >= 0) continue;
      // Get the virtual list index from the style (top offset)
      var top = parseInt(el.style.top, 10);
      var rowIndex = isNaN(top) ? i : Math.round(top / 70);
      result.push({ rowIndex: rowIndex, text: text, top: top });
    }
    return {
      ok: true,
      items: result,
      scrollTop: vList.scrollTop,
      scrollHeight: vList.scrollHeight,
      clientHeight: vList.clientHeight
    };
  } catch (e) { return { ok: false, items: [], error: e.message }; }
})();
`;
}

/**
 * Scan the virtual list by scrolling through it and collecting all unique chat names.
 * Returns an ordered list of chat names from top to bottom.
 */
async function scanChatList(webContents: WebContents, targetCount: number): Promise<string[]> {
  const ROW_HEIGHT = 70; // approximate px per chat row
  const SCROLL_STEP = ROW_HEIGHT * 5; // scroll ~5 chats at a time
  const PAUSE_MS = 800;
  const chatNames: string[] = [];
  const seen = new Set<string>();

  // Start from top
  await webContents.executeJavaScript(scriptScrollToPosition(0));
  await sleep(500);

  botState.lastStatus.lastCycle = `Scanning chats (0/${targetCount})…`;

  // Get scroll dimensions
  const info = await webContents.executeJavaScript(scriptGetVisibleChats());
  const maxScroll = (info?.scrollHeight ?? 5000) - (info?.clientHeight ?? 600);

  let scrollPos = 0;
  let staleRounds = 0;
  let lastSize = 0;

  while (scrollPos <= maxScroll + SCROLL_STEP) {
    if (!botState.enabled) break;
    if (chatNames.length >= targetCount) break;

    const result = await webContents.executeJavaScript(scriptGetVisibleChats());
    if (result?.ok && result.items) {
      for (const item of result.items) {
        const name = (item.text || '').trim();
        if (name && !seen.has(name) && !/my\s*ai/i.test(name)) {
          seen.add(name);
          chatNames.push(name);
        }
      }
    }

    botState.lastStatus.lastCycle = `Scanning chats (${chatNames.length}/${targetCount})…`;

    if (chatNames.length === lastSize) {
      staleRounds++;
      if (staleRounds >= 6) break; // no new chats found after many scrolls
    } else {
      staleRounds = 0;
      lastSize = chatNames.length;
    }

    scrollPos += SCROLL_STEP;
    await webContents.executeJavaScript(scriptScrollToPosition(scrollPos));
    await sleep(PAUSE_MS);
  }

  // Scroll back to top
  await webContents.executeJavaScript(scriptScrollToPosition(0));
  await sleep(500);

  return chatNames;
}

let scannedChats: string[] = [];
let hasScanned = false;

/**
 * Scroll the virtual list until the target chat name is visible in the DOM,
 * then return true. Returns false if not found after full scroll.
 */
async function scrollToChatByName(webContents: WebContents, chatName: string): Promise<boolean> {
  const ROW_HEIGHT = 70;
  const SCROLL_STEP = ROW_HEIGHT * 4;

  // First check if it's already visible
  const check = await webContents.executeJavaScript(scriptGetVisibleChats());
  if (check?.ok && check.items?.some((it: { text: string }) => it.text.indexOf(chatName.slice(0, 30)) === 0)) {
    return true;
  }

  const maxScroll = (check?.scrollHeight ?? 5000) - (check?.clientHeight ?? 600);
  let scrollPos = 0;

  while (scrollPos <= maxScroll + SCROLL_STEP) {
    await webContents.executeJavaScript(scriptScrollToPosition(scrollPos));
    await sleep(400);
    const result = await webContents.executeJavaScript(scriptGetVisibleChats());
    if (result?.ok && result.items?.some((it: { text: string }) => it.text.indexOf(chatName.slice(0, 30)) === 0)) {
      return true;
    }
    scrollPos += SCROLL_STEP;
  }
  return false;
}

async function runCycle(webContents: WebContents): Promise<void> {
  if (!botState.enabled) return;
  if (cycleRunning) return;
  cycleRunning = true;
  try {
    botState.lastStatus.connected = true;
    botState.lastStatus.error = null;

    // Scan chat list on first run (or after reset)
    if (!hasScanned) {
      const targetCount = botState.selectedChats?.to ?? 100;
      scannedChats = await scanChatList(webContents, targetCount);
      hasScanned = true;
      botState.lastStatus.lastCycle = `Found ${scannedChats.length} chats · starting cycle`;
      if (!scannedChats.length) {
        botState.lastStatus.lastCycle = 'no chats found';
        return;
      }
    }

    // Apply range filter
    const fromIdx = (botState.selectedChats?.from ?? 1) - 1;
    const toIdx = botState.selectedChats?.to ?? scannedChats.length;
    const chatQueue = scannedChats.slice(fromIdx, toIdx);

    for (let qi = 0; qi < chatQueue.length; qi++) {
      const chatName = chatQueue[qi];
      if (!botState.enabled) break;
      const key = `chat-${chatName.slice(0, 30)}`;
      if (cooldown.get(key) && Date.now() - (cooldown.get(key) ?? 0) < COOLDOWN_MS) continue;

      botState.lastStatus.lastCycle = `Chat ${qi + 1}/${chatQueue.length}: ${chatName.slice(0, 20)}`;

      try {
        // Scroll virtual list until this chat is visible
        const found = await scrollToChatByName(webContents, chatName);
        if (!found) {
          botState.lastStatus.error = `Could not find: ${chatName.slice(0, 20)}`;
          continue;
        }

        if (!botState.enabled) break;
        await webContents.executeJavaScript(scriptHighlightChat(chatName));
        await sleep(300);
        await webContents.executeJavaScript(scriptClickChatByName(chatName));
        await randomDelay(1200, 1800);
        if (!botState.enabled) break;

        const msgResult = await webContents.executeJavaScript(scriptGetLastMessage());
        if (!msgResult?.ok) {
          if (msgResult?.error) botState.lastStatus.error = msgResult.error;
          continue;
        }

        // Detect new/empty chat
        const isEmptyChat =
          !msgResult.lastText?.trim() ||
          msgResult.isNewChat ||
          !(msgResult.recentMessages && msgResult.recentMessages.length);
        if (msgResult.lastFromMe && !isEmptyChat) continue;

        let response: string;
        if (isEmptyChat) {
          response = botState.newChatReply || 'hey';
        } else {
          try {
            response = await generateReply(msgResult.lastText, msgResult.recentMessages || []);
          } catch (e) {
            botState.lastStatus.error = e instanceof Error ? e.message : String(e);
            response = 'ok';
          }
          if (!response || !String(response).trim()) response = 'ok';
          const r = (response || '').trim().toLowerCase();
          if (/i (will not|won't|can't|cannot|don't|do not) respond/i.test(r) ||
              /won't respond|can't respond|will not respond/i.test(r)) {
            response = botState.newChatReply || 'hey';
          }
        }

        await randomDelay(1000, 1500);
        if (!botState.enabled) break;

        const typeResult = await webContents.executeJavaScript(scriptTypeInInput(response));
        if (!typeResult?.ok) {
          botState.lastStatus.lastCycle = typeResult?.error === 'no input' ? 'input box not found' : 'type failed';
          if (typeResult?.error) botState.lastStatus.error = typeResult.error;
          continue;
        }

        for (let attempt = 0; attempt < 4; attempt++) {
          await new Promise<void>((r) => setTimeout(r, attempt === 0 ? 1000 : 400));
          const sendResult = await webContents.executeJavaScript(scriptClickSend());
          if (sendResult?.ok) {
            cooldown.set(key, Date.now());
            botState.lastStatus.lastCycle = `replied to ${chatName.slice(0, 20)}`;
            break;
          }
          if (attempt === 3) {
            botState.lastStatus.lastCycle = sendResult?.error === 'no send' ? 'typed but send button not found' : 'send click failed';
            if (sendResult?.error) botState.lastStatus.error = sendResult.error;
          }
        }
      } catch (e) {
        botState.lastStatus.error = e instanceof Error ? e.message : String(e);
      }
      if (!botState.enabled) break;
      await randomDelay(1000, 1500);
    }
  } catch (e) {
    botState.lastStatus.error = e instanceof Error ? e.message : String(e);
  } finally {
    try { await webContents.executeJavaScript(scriptClearHighlight()); } catch {}
    cycleRunning = false;
  }
}

export function startBot(webContents: WebContents): void {
  if (!process.env.GROQ_API_KEY) {
    console.warn('Bot: GROQ_API_KEY missing. AI replies will use fallback. Add to .env for Groq.');
  }
  const WAIT_FOR_LOGIN_MS = 5 * 1000;
  console.log(
    'Bot: SnapBot ready. Turn the bot ON and set chats (e.g. 1–20). Bot will start in',
    WAIT_FOR_LOGIN_MS / 1000,
    's.'
  );
  const run = () => runCycle(webContents);
  setTimeout(run, WAIT_FOR_LOGIN_MS);
  if (botIntervalId) clearInterval(botIntervalId);
  botIntervalId = setInterval(run, 3 * 1000);
}

export function resetPreload(): void {
  hasScanned = false;
  scannedChats = [];
}

export function stopBot(): void {
  if (botIntervalId) {
    clearInterval(botIntervalId);
    botIntervalId = null;
  }
  hasScanned = false;
  scannedChats = [];
}
