import { notFound, type ServiceContext } from '../context';

export type CompanyArgs = { name: string; domain?: string | null };

export async function createCompany({ repos }: Pick<ServiceContext, 'repos'>, args: CompanyArgs): Promise<{ id: string }> {
  const company = await repos.companies.insert({ name: args.name.trim(), domain: args.domain ?? null });
  return { id: company.id };
}

export async function updateCompany(
  { repos }: Pick<ServiceContext, 'repos'>,
  { id, ...args }: CompanyArgs & { id: string },
): Promise<{ id: string }> {
  if (!(await repos.companies.getById(id))) throw notFound('Empresa');
  await repos.companies.update(id, { name: args.name.trim(), domain: args.domain ?? null });
  return { id };
}
