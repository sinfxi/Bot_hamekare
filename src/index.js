export default {
 async fetch(req, env) {
  if (new URL(req.url).pathname !== '/telegram' || req.method !== 'POST') return new Response('Not found',{status:404});
  if (!env.WEBHOOK_SECRET || req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) return new Response('Forbidden',{status:403});
  const u = await req.json();
  const m = u.message;
  if (!m || !['group','supergroup'].includes(m.chat.type)) return new Response('OK');
  const cmd = (m.text || '').trim();
  const api = async (method, body) => {
   const r = await fetch('https://api.telegram.org/bot'+env.BOT_TOKEN+'/'+method,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if (!r.ok) throw new Error('Telegram API '+r.status);
   return r.json();
  };
  if (cmd === 'راهنما') {
   await api('sendMessage',{chat_id:m.chat.id,text:'دستورها: سنجاق، حذف، شناسه، راهنما'});
  } else if (cmd === 'شناسه') {
   await api('sendMessage',{chat_id:m.chat.id,text:'شناسه گروه: '+m.chat.id});
  } else if (['سنجاق','حذف'].includes(cmd) && m.reply_to_message && m.from) {
   const member = await api('getChatMember',{chat_id:m.chat.id,user_id:m.from.id});
   if (!['creator','administrator'].includes(member.result.status)) return new Response('OK');
   await api(cmd==='سنجاق'?'pinChatMessage':'deleteMessage',{chat_id:m.chat.id,message_id:m.reply_to_message.message_id});
  }
  return new Response('OK');
 }
};