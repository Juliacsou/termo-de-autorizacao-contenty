export const fmtDate = value => value ? new Date(value.includes('T') ? value : `${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
export const fmtTime = value => value ? new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—';
export function datesSummary(entries=[]) {return entries.map(e=>e.type==='range' ? `${fmtDate(e.start)} a ${fmtDate(e.end)}` : fmtDate(e.date)).join(' · ') || 'Sem data';}
export function initials(name='') {return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'CO';}
export function downloadBlob(blob,name) {const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
export const safeName=value=>(value||'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'arquivo';
export function csvField(value){let t=String(value??'');if(/^[\s]*[=+@\-\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}
export function exportParticipantsCSV(project, participants){let rows=[['Nome','Telefone','Endereço','Menor de idade','Responsável','Telefone do responsável','Endereço do responsável','Assinado em','Projeto'],...participants.map(p=>[p.full_name,p.phone,p.address,p.is_minor?'Sim':'Não',p.guardian_name,p.guardian_phone,p.guardian_address,fmtTime(p.signed_at),project.name])];const csv='\uFEFF'+rows.map(r=>r.map(csvField).join(';')).join('\r\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`participantes-${safeName(project.name)}.csv`);}
export function publicLink(token) {const u=new URL(window.location.href);u.hash=`/assinar/${token}`;return u.toString();}
export const isValidPhone=phone=>phone.replace(/\D/g,'').length>=10&&phone.replace(/\D/g,'').length<=13;
