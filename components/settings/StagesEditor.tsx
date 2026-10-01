'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { createStage, deleteStage, reorderStages, updateStage } from '@/app/actions/stages';
import { Field, selectClassName } from '@/components/common/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Stage } from '@/lib/domain';
import { useAction } from '@/lib/hooks/useAction';

const KIND_LABEL = { open: 'Em aberto', won: 'Desfecho: ganho', lost: 'Desfecho: perdido', standby: 'Desfecho: stand-by' };

function lockReason(stage: Stage): string | null {
  if (stage.kind !== 'open') return 'Etapas de desfecho não podem ser excluídas.';
  if (stage.key) return 'Etapa usada pelas regras do funil.';
  return null;
}

function StageRow({ stage, index, stages }: { stage: Stage; index: number; stages: Stage[] }) {
  const update = useAction(updateStage, { successMessage: 'Etapa salva.' });
  const remove = useAction(deleteStage, { successMessage: 'Etapa excluída.' });
  const reorder = useAction(reorderStages);
  const locked = lockReason(stage);

  function move(delta: number) {
    const ids = stages.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved!);
    void reorder.run({ orderedIds: ids });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await update.run({
      id: stage.id,
      name: String(form.get('name') ?? ''),
      probability: String(form.get('probability') ?? ''),
      color: String(form.get('color') ?? ''),
    });
  }

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[auto_1fr_7rem_5rem_auto] sm:items-end" noValidate>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Subir" disabled={index === 0} onClick={() => move(-1)}>
            <ArrowUp className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Descer" disabled={index === stages.length - 1} onClick={() => move(1)}>
            <ArrowDown className="size-4" />
          </Button>
        </div>
        <Field label={`Nome · ${KIND_LABEL[stage.kind]}`} htmlFor={`name-${stage.id}`} error={update.fieldErrors.name}>
          <Input id={`name-${stage.id}`} name="name" defaultValue={stage.name} maxLength={60} />
        </Field>
        <Field label="Probab. (%)" htmlFor={`prob-${stage.id}`} error={update.fieldErrors.probability}>
          <Input id={`prob-${stage.id}`} name="probability" type="number" min={0} max={100} defaultValue={stage.probability} />
        </Field>
        <Field label="Cor" htmlFor={`color-${stage.id}`} error={update.fieldErrors.color}>
          <Input id={`color-${stage.id}`} name="color" type="color" defaultValue={stage.color ?? '#A1A1AA'} className="p-1" />
        </Field>
        <div className="flex gap-1">
          <Button type="submit" variant="outline" size="sm" disabled={update.pending}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={locked ?? `Excluir ${stage.name}`}
            title={locked ?? 'Excluir etapa (só sem deals)'}
            disabled={Boolean(locked) || remove.pending}
            onClick={() => window.confirm(`Excluir a etapa "${stage.name}"?`) && remove.run(stage.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </form>
    </li>
  );
}

/** Gestão do funil (US7): renomear, probabilidade 0–100, cor, ordem, nova etapa e exclusão protegida. */
export function StagesEditor({ stages }: { stages: Stage[] }) {
  const create = useAction(createStage, { successMessage: 'Etapa criada.' });
  const openStages = stages.filter((stage) => stage.kind === 'open');

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const result = await create.run({
      name: String(form.get('name') ?? ''),
      probability: String(form.get('probability') ?? ''),
      color: String(form.get('color') ?? ''),
      afterStageId: String(form.get('afterStageId') ?? ''),
    });
    if (result.ok) element.reset();
  }

  return (
    <div className="grid gap-6">
      <ol className="grid gap-2">
        {stages.map((stage, index) => (
          <StageRow key={`${stage.id}-${stage.position}`} stage={stage} index={index} stages={stages} />
        ))}
      </ol>

      <form onSubmit={onCreate} className="grid gap-3 rounded-card border border-dashed border-border p-4 sm:grid-cols-[1fr_7rem_5rem_1fr_auto] sm:items-end" noValidate>
        <Field label="Nova etapa" htmlFor="new-stage-name" error={create.fieldErrors.name}>
          <Input id="new-stage-name" name="name" maxLength={60} required />
        </Field>
        <Field label="Probab. (%)" htmlFor="new-stage-prob" error={create.fieldErrors.probability}>
          <Input id="new-stage-prob" name="probability" type="number" min={0} max={100} required />
        </Field>
        <Field label="Cor" htmlFor="new-stage-color">
          <Input id="new-stage-color" name="color" type="color" defaultValue="#A1A1AA" className="p-1" />
        </Field>
        <Field label="Depois de" htmlFor="new-stage-after" error={create.fieldErrors.afterStageId}>
          <select id="new-stage-after" name="afterStageId" className={selectClassName} defaultValue={openStages.at(-1)?.id}>
            {openStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" disabled={create.pending}>
          Adicionar
        </Button>
      </form>
    </div>
  );
}
