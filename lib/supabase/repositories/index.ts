import type { DbClient } from '../server';
import { createActivitiesRepo } from './activities';
import { createCompaniesRepo } from './companies';
import { createContactsRepo } from './contacts';
import { createDealsRepo } from './deals';
import { createProfilesRepo } from './profiles';
import { createStagesRepo } from './stages';
import type { Repos } from './types';

export function createRepos(db: DbClient): Repos {
  return {
    profiles: createProfilesRepo(db),
    stages: createStagesRepo(db),
    deals: createDealsRepo(db),
    activities: createActivitiesRepo(db),
    contacts: createContactsRepo(db),
    companies: createCompaniesRepo(db),
  };
}

export type { Repos } from './types';
