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
  process.env.BNCC_API_URL ?? "https://bncc.betrybe.com/api/habilidades/";

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

async function buscarNaApi(config: DisciplinaConfig): Promise<BnccObjetivo[]> {
  const url = new URL(DEFAULT_API_URL);
  if (config.componente) url.searchParams.append("componente", config.componente);
  if (config.busca) url.searchParams.append("busca", config.busca);
  url.searchParams.append("etapa", config.etapa ?? "EM");

  try {
    const payload: unknown = await new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (!response.statusCode || response.statusCode >= 400) {
          reject(
            new Error(
              `Resposta inesperada da API da BNCC: ${response.statusCode}`
            )
          );
          response.resume();
          return;
        }

        let rawData = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawData += chunk;
        });
        response.on("end", () => {
          try {
            resolve(rawData ? JSON.parse(rawData) : []);
          } catch (error) {
            reject(error);
          }
        });
      });

      request.setTimeout(5000, () => {
        request.destroy(new Error("Tempo limite ao consultar a API da BNCC."));
      });

      request.on("error", reject);
    });

    const arrayPayload = Array.isArray(payload) ? payload : [];

    const parsed = arrayPayload
      .map((item: any) => {
        const codigo =
          item?.codigo ||
          item?.codigo_habilidade ||
          item?.codigoHabilidade ||
          item?.cod_habilidade;
        const descricao =
          item?.descricao ||
          item?.habilidade ||
          item?.descricao_habilidade ||
          item?.texto;

        if (!codigo || !descricao) return null;

        return {
          codigo,
          descricao,
          etapa: item?.etapa || config.etapa || "EM",
          area: item?.area || config.area,
        } satisfies BnccObjetivo;
      })
      .filter((entry): entry is BnccObjetivo => Boolean(entry));

    if (parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.warn("Falha ao consultar a API da BNCC:", (error as Error).message);
  }

  return [];
}

export async function obterObjetivosBnccPorDisciplina(
  disciplina: string
): Promise<BnccObjetivo[]> {
  const config = obterConfigDisciplina(disciplina);
  if (!config) {
    return filtrarFallbackPorDisciplina(disciplina);
  }

  const objetivos = await buscarNaApi(config);
  if (objetivos.length > 0) {
    return objetivos;
  }

  const fallback = filtrarFallbackPorDisciplina(disciplina);
  if (fallback.length > 0) {
    return fallback.map(({ codigo, descricao, etapa, area }) => ({
      codigo,
      descricao,
      etapa,
      area,
    }));
  }

  return bnccFallback.map(({ codigo, descricao, etapa, area }) => ({
    codigo,
    descricao,
    etapa,
    area,
  }));
}
