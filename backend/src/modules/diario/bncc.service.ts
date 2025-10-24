import https from "node:https";
import { URL } from "node:url";
import { bnccFallback } from "@/data/bnccFallback";

export type BnccObjetivo = {
  codigo: string;
  descricao: string;
  etapa?: string;
  area?: string;
};

type DisciplinaConfig = {
  componente?: string;
  etapa?: string;
  busca?: string;
  area?: string;
  aliases?: string[];
};

const DEFAULT_API_URL =
  process.env.BNCC_API_URL ??
  "https://cientificar1992.pythonanywhere.com/visualizarBncc";

const disciplinaCache = new Map<string, BnccObjetivo[]>();

const codigoParaDisciplinas = new Map<string, Set<string>>();
bnccFallback.forEach((item) => {
  if (!item.codigo) return;
  const disciplinas = item.componentes || [];
  const conjunto =
    codigoParaDisciplinas.get(item.codigo) ?? new Set<string>();
  disciplinas.forEach((disciplina) => {
    conjunto.add(normalizarNomeDisciplina(disciplina));
  });
  codigoParaDisciplinas.set(item.codigo, conjunto);
});

const disciplinaMap: Record<string, DisciplinaConfig> = {
  matemática: { componente: "MATEMÁTICA", etapa: "EM", area: "MATEMATICA" },
  matematica: { componente: "MATEMÁTICA", etapa: "EM", area: "MATEMATICA" },
  física: { busca: "Física", etapa: "EM", area: "CIENCIAS_DA_NATUREZA" },
  fisica: { busca: "Física", etapa: "EM", area: "CIENCIAS_DA_NATUREZA", aliases: ["ciências da natureza"] },
  química: { busca: "Química", etapa: "EM", area: "CIENCIAS_DA_NATUREZA" },
  quimica: { busca: "Química", etapa: "EM", area: "CIENCIAS_DA_NATUREZA" },
  biologia: { busca: "Biologia", etapa: "EM", area: "CIENCIAS_DA_NATUREZA" },
  "língua portuguesa": {
    busca: "Língua Portuguesa",
    etapa: "EM",
    area: "LINGUAGENS",
    aliases: ["linguagens", "português"],
  },
  artes: { busca: "Artes", etapa: "EM", area: "LINGUAGENS" },
  "educação física": {
    busca: "Educação Física",
    etapa: "EM",
    area: "LINGUAGENS",
  },
  história: {
    busca: "História",
    etapa: "EM",
    area: "CIENCIAS_HUMANAS",
    aliases: ["ciências humanas"],
  },
  historia: {
    busca: "História",
    etapa: "EM",
    area: "CIENCIAS_HUMANAS",
  },
  geografia: { busca: "Geografia", etapa: "EM", area: "CIENCIAS_HUMANAS" },
  filosofia: { busca: "Filosofia", etapa: "EM", area: "CIENCIAS_HUMANAS" },
  sociologia: { busca: "Sociologia", etapa: "EM", area: "CIENCIAS_HUMANAS" },
  inglês: {
    busca: "Inglês",
    etapa: "EM",
    area: "LINGUAGENS",
    aliases: ["língua inglesa"],
  },
};

function normalizarNomeDisciplina(nome: string) {
  return nome.trim().toLowerCase();
}

function obterConfigDisciplina(nome: string): DisciplinaConfig | undefined {
  const normalizado = normalizarNomeDisciplina(nome);
  if (disciplinaMap[normalizado]) {
    return disciplinaMap[normalizado];
  }

  const aliasMatch = Object.entries(disciplinaMap).find(([_, config]) =>
    config.aliases?.some(
      (alias) => normalizarNomeDisciplina(alias) === normalizado
    )
  );

  return aliasMatch?.[1];
}

function filtrarFallbackPorDisciplina(nome: string) {
  const normalizado = normalizarNomeDisciplina(nome);
  return bnccFallback.filter((item) =>
    item.componentes.some(
      (disciplina) => normalizarNomeDisciplina(disciplina) === normalizado
    )
  );
}

function extrairColecao(payload: unknown): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidates = [
    "results",
    "habilidades",
    "data",
    "items",
    "objetivos",
    "habilidadesBncc",
  ];

  for (const key of candidates) {
    const value = (payload as any)[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function extrairObjetivos(
  payload: unknown,
  config?: DisciplinaConfig
): BnccObjetivo[] {
  const collection = extrairColecao(payload);

  const areaPadrao = config?.area;
  const etapaPadrao = config?.etapa ?? "EM";

  const objetivos = collection
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const codigo =
        (item as any).codigo ||
        (item as any).codigo_habilidade ||
        (item as any).codigoHabilidade ||
        (item as any).cod_habilidade ||
        (item as any).codigoHabilidadeBNCC;
      const descricao =
        (item as any).descricao ||
        (item as any).habilidade ||
        (item as any).descricao_habilidade ||
        (item as any).texto ||
        (item as any).habilidadeBNCC;

      if (!codigo || !descricao) return null;

      const etapa =
        (item as any).etapa || (item as any).etapa_ensino || etapaPadrao;
      const area = (item as any).area || (item as any).areaConhecimento;

      return {
        codigo: String(codigo).trim(),
        descricao: String(descricao).trim(),
        etapa: etapa ? String(etapa).trim() : etapaPadrao,
        area: area ? String(area).trim() : areaPadrao,
      } satisfies BnccObjetivo;
    })
    .filter((item): item is BnccObjetivo => Boolean(item));

  const visto = new Map<string, BnccObjetivo>();
  objetivos.forEach((objetivo) => {
    if (!visto.has(objetivo.codigo)) {
      visto.set(objetivo.codigo, objetivo);
    }
  });

  return Array.from(visto.values());
}

function construirTentativasApi(
  disciplina: string,
  config?: DisciplinaConfig
): string[] {
  const base = DEFAULT_API_URL.replace(/\/$/, "");
  const slug = encodeURIComponent(
    disciplina
      .normalize("NFD")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
  );
  const encoded = encodeURIComponent(disciplina);
  const tentativaBusca = config?.busca
    ? encodeURIComponent(config.busca)
    : encoded;

  return [
    `${base}/disciplinas/${slug}/`,
    `${base}/componentes/${slug}/`,
    `${base}/?disciplina=${encoded}`,
    `${base}/?componente=${encoded}`,
    `${base}/buscar/?termo=${tentativaBusca}`,
    `${base}/${slug}/`,
    `${base}/habilidades/`,
    `${base}/`,
  ];
}

async function requisitar(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);

      const request = https.get(parsed, (response) => {
        if (!response.statusCode || response.statusCode >= 400) {
          response.resume();
          reject(
            new Error(`Resposta inesperada da API da BNCC: ${response.statusCode}`)
          );
          return;
        }

        let rawData = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawData += chunk;
        });
        response.on("end", () => {
          if (!rawData) {
            resolve([]);
            return;
          }

          try {
            resolve(JSON.parse(rawData));
          } catch (error) {
            reject(error);
          }
        });
      });

      request.setTimeout(7000, () => {
        request.destroy(new Error("Tempo limite ao consultar a API da BNCC."));
      });

      request.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

function filtrarPorDisciplina(
  objetivos: BnccObjetivo[],
  disciplina: string,
  config?: DisciplinaConfig
) {
  if (!objetivos.length) return objetivos;

  const normalizado = normalizarNomeDisciplina(disciplina);
  const areaEsperada = config?.area;

  return objetivos.filter((objetivo) => {
    const codigoNormalizado = objetivo.codigo.trim().toUpperCase();
    const disciplinasConhecidas = codigoParaDisciplinas.get(codigoNormalizado);

    const pertenceAoFallback = disciplinasConhecidas
      ? disciplinasConhecidas.has(normalizado)
      : true;

    const areaCompativel = areaEsperada
      ? objetivo.area?.toUpperCase() === areaEsperada
      : true;

    if (!pertenceAoFallback) {
      return false;
    }

    if (!areaCompativel) {
      return false;
    }

    return true;
  });
}

async function buscarNaApi(
  disciplina: string,
  config?: DisciplinaConfig
): Promise<BnccObjetivo[]> {
  const tentativas = construirTentativasApi(disciplina, config);

  for (const url of tentativas) {
    try {
      const payload = await requisitar(url);
      const objetivos = extrairObjetivos(payload, config);
      if (objetivos.length) {
        const filtrados = filtrarPorDisciplina(objetivos, disciplina, config);
        if (filtrados.length) {
          return filtrados;
        }
      }
    } catch (error) {
      console.warn(
        `Falha ao consultar a API da BNCC (${url}):`,
        (error as Error).message
      );
    }
  }

  return [];
}

export async function obterObjetivosBnccPorDisciplina(
  disciplina: string
): Promise<BnccObjetivo[]> {
  const normalizado = normalizarNomeDisciplina(disciplina);
  if (disciplinaCache.has(normalizado)) {
    return disciplinaCache.get(normalizado)!;
  }

  const config = obterConfigDisciplina(disciplina);
  const objetivosApi = await buscarNaApi(disciplina, config);
  if (objetivosApi.length > 0) {
    disciplinaCache.set(normalizado, objetivosApi);
    return objetivosApi;
  }

  const fallback = filtrarFallbackPorDisciplina(disciplina).map(
    ({ codigo, descricao, etapa, area }) => ({
      codigo,
      descricao,
      etapa,
      area,
    })
  );

  if (fallback.length > 0) {
    disciplinaCache.set(normalizado, fallback);
    return fallback;
  }

  const generico = bnccFallback.map(({ codigo, descricao, etapa, area }) => ({
    codigo,
    descricao,
    etapa,
    area,
  }));

  disciplinaCache.set(normalizado, generico);
  return generico;
}
