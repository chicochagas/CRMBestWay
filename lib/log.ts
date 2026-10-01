// Logs estruturados sem PII (constituição §IV): só evento, códigos e ids.
// Nunca passe e-mail, telefone, nome ou conteúdo de nota para cá.

type LogFields = {
  code?: string;
  dealId?: string;
  contactId?: string;
  userId?: string;
  pgCode?: string;
  detail?: string;
};

function write(level: 'info' | 'warn' | 'error', event: string, fields: LogFields) {
  const line = JSON.stringify({ level, event, ...fields, at: new Date().toISOString() });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

export const log = {
  info: (event: string, fields: LogFields = {}) => write('info', event, fields),
  warn: (event: string, fields: LogFields = {}) => write('warn', event, fields),
  error: (event: string, fields: LogFields = {}) => write('error', event, fields),
};
