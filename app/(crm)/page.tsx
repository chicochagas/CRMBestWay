import { redirect } from 'next/navigation';

// Até a feature do dashboard existir, a tela inicial é o pipeline (spec, Assumptions).
export default function Home() {
  redirect('/pipeline');
}
