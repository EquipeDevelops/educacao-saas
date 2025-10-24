import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { bnccFallback } from "@/data/bnccFallback";

export type BnccObjetivo = {
  codigo: string;
  descricao: string;
  etapa?: string;
  area?: string;
};

type EtapaApi = "medio" | "fundamental";

type DisciplinaConfig = {
  area?: string;
  aliases?: string[];
  preferencia?: EtapaApi;
  keywords?: string[];
  slugs: Partial<Record<EtapaApi, string>>;
};

export type BnccBuscaContexto = {
  serie?: string | null;
};

const DEFAULT_API_URL =
  process.env.BNCC_API_URL ?? "https://cientificar1992.pythonanywhere.com";

type CacheEntry = {
  objetivos: BnccObjetivo[];
  origem: "api" | "fallback";
  atualizadoEm: number;
};

const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos para revalidar entradas de cache

const disciplinaCache = new Map<string, CacheEntry>();

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
  matematica: {
    slugs: { medio: "matematica_medio", fundamental: "matematica" },
    area: "MATEMATICA",
    preferencia: "medio",
    keywords: ["mat", "matematica", "matemat", "matematica basica"],
  },
  fisica: {
    slugs: { medio: "ciencias_natureza" },
    area: "CIENCIAS_DA_NATUREZA",
    aliases: ["ciencias da natureza", "ciencias da natureza e suas tecnologias"],
    keywords: ["fis", "fisica", "fisico"],
    preferencia: "medio",
  },
  quimica: {
    slugs: { medio: "ciencias_natureza" },
    area: "CIENCIAS_DA_NATUREZA",
    aliases: ["ciencias da natureza", "ciencias da natureza e suas tecnologias"],
    keywords: ["quim", "quimica"],
    preferencia: "medio",
  },
  biologia: {
    slugs: { medio: "ciencias_natureza" },
    area: "CIENCIAS_DA_NATUREZA",
    aliases: ["ciencias da natureza", "ciencias da natureza e suas tecnologias"],
    keywords: ["bio", "biologia", "biolog"],
    preferencia: "medio",
  },
  "ciencias da natureza": {
    slugs: { medio: "ciencias_natureza" },
    area: "CIENCIAS_DA_NATUREZA",
    aliases: ["ciencias da natureza e suas tecnologias"],
    keywords: ["natureza", "ciencias natureza"],
    preferencia: "medio",
  },
  ciencias: {
    slugs: { fundamental: "ciencias" },
    area: "CIENCIAS_DA_NATUREZA",
    keywords: ["ciencias", "ciencia"],
    preferencia: "fundamental",
  },
  geografia: {
    slugs: { fundamental: "geografia", medio: "ciencias_humanas" },
    area: "CIENCIAS_HUMANAS",
    keywords: ["geo", "geografia"],
  },
  historia: {
    slugs: { fundamental: "historia", medio: "ciencias_humanas" },
    area: "CIENCIAS_HUMANAS",
    keywords: ["hist", "historia", "hist"],
  },
  filosofia: {
    slugs: { medio: "ciencias_humanas" },
    area: "CIENCIAS_HUMANAS",
    keywords: ["filo", "filosofia"],
    preferencia: "medio",
  },
  sociologia: {
    slugs: { medio: "ciencias_humanas" },
    area: "CIENCIAS_HUMANAS",
    keywords: ["socio", "sociologia"],
    preferencia: "medio",
  },
  "ciencias humanas": {
    slugs: { medio: "ciencias_humanas" },
    area: "CIENCIAS_HUMANAS",
    aliases: ["ciencias humanas e sociais aplicadas"],
    keywords: ["humanas", "ciencias humanas"],
    preferencia: "medio",
  },
  linguagens: {
    slugs: { medio: "linguagens" },
    area: "LINGUAGENS",
    aliases: ["linguagens e suas tecnologias", "linguagem"],
    keywords: ["linguagens", "linguagem"],
    preferencia: "medio",
  },
  "lingua portuguesa": {
    slugs: { medio: "lingua_portuguesa_medio", fundamental: "lingua_portuguesa" },
    area: "LINGUAGENS",
    aliases: [
      "portugues",
      "portuguesa",
      "lingua portuguesa e literatura",
      "literatura",
    ],
    keywords: ["port", "portugues", "lp", "lingua portuguesa", "lingua portuguesa literatura"],
  },
  portugues: {
    slugs: { medio: "lingua_portuguesa_medio", fundamental: "lingua_portuguesa" },
    area: "LINGUAGENS",
    aliases: ["lingua portuguesa"],
    keywords: ["port", "portugues", "lp"],
  },
  "lingua inglesa": {
    slugs: { fundamental: "lingua_inglesa" },
    area: "LINGUAGENS",
    aliases: ["ingles", "inglesa"],
    keywords: ["ingles", "inglesa", "li", "lingua inglesa"],
  },
  ingles: {
    slugs: { fundamental: "lingua_inglesa" },
    area: "LINGUAGENS",
    aliases: ["lingua inglesa"],
    keywords: ["ingles", "inglesa"],
  },
  arte: {
    slugs: { fundamental: "arte" },
    area: "LINGUAGENS",
    aliases: ["artes"],
    keywords: ["art", "arte", "artes"],
    preferencia: "fundamental",
  },
  "educacao fisica": {
    slugs: { fundamental: "educacao_fisica" },
    area: "LINGUAGENS",
    keywords: ["ed fis", "educacao fisica", "ef"],
    preferencia: "fundamental",
  },
  "ensino religioso": {
    slugs: { fundamental: "ensino_religioso" },
    area: "CIENCIAS_HUMANAS",
    keywords: ["religioso", "religiao"],
    preferencia: "fundamental",
  },
  computacao: {
    slugs: { fundamental: "computacao", medio: "computacao_medio" },
    area: "TECNOLOGIA",
    keywords: ["comp", "computacao", "informatica", "ti"],
  },
};

function removerAcentos(valor: string) {
  return valor.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizarNomeDisciplina(nome: string) {
  return removerAcentos(nome).trim().toLowerCase();
}

function variacoesConfig(key: string, config: DisciplinaConfig) {
  const conjunto = new Set<string>();
  conjunto.add(normalizarNomeDisciplina(key));
  config.aliases?.forEach((alias) =>
    conjunto.add(normalizarNomeDisciplina(alias))
  );
  config.keywords?.forEach((keyword) =>
    conjunto.add(normalizarNomeDisciplina(keyword))
  );
  return Array.from(conjunto);
}

function pontuarConfigPorNome(
  nomeNormalizado: string,
  variacoes: string[]
) {
  if (!variacoes.length) return 0;

  const tokensNome = nomeNormalizado
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const conjuntoTokens = new Set(tokensNome);
  const nomeSemEspaco = nomeNormalizado.replace(/\s+/g, "");

  let melhorPontuacao = 0;

  variacoes.forEach((variacao) => {
    if (!variacao) return;
    const normalizado = variacao;
    if (nomeNormalizado === normalizado) {
      melhorPontuacao = Math.max(melhorPontuacao, 1000);
      return;
    }

    if (nomeNormalizado.includes(normalizado)) {
      melhorPontuacao = Math.max(melhorPontuacao, normalizado.length * 4);
    }

    const tokensVariacao = normalizado.split(/[^a-z0-9]+/).filter(Boolean);
    if (!tokensVariacao.length) return;

    const tokensCorrespondentes = tokensVariacao.filter((token) =>
      conjuntoTokens.has(token)
    );

    if (tokensCorrespondentes.length === tokensVariacao.length) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        tokensCorrespondentes.length * 50
      );
    } else if (tokensCorrespondentes.length > 0) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        tokensCorrespondentes.length * 10
      );
    }

    const variacaoSemEspaco = normalizado.replace(/\s+/g, "");
    if (
      variacaoSemEspaco.length >= 3 &&
      nomeSemEspaco.includes(variacaoSemEspaco)
    ) {
      melhorPontuacao = Math.max(
        melhorPontuacao,
        variacaoSemEspaco.length * 3
      );
    }
  });

  return melhorPontuacao;
}

function obterConfigDisciplina(nome: string): DisciplinaConfig | undefined {
  const normalizado = normalizarNomeDisciplina(nome);
  if (disciplinaMap[normalizado]) {
    return disciplinaMap[normalizado];
  }

  const entradaDireta = Object.entries(disciplinaMap).find(([chave]) =>
    normalizado.includes(chave)
  );
  if (entradaDireta) {
    return entradaDireta[1];
  }

  const variacoesPontuadas = Object.entries(disciplinaMap).map(
    ([chave, config]) => {
      const variacoes = variacoesConfig(chave, config);
      const pontuacao = pontuarConfigPorNome(normalizado, variacoes);
      return { chave, config, pontuacao };
    }
  );

  const melhor = variacoesPontuadas
    .filter((entrada) => entrada.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao)[0];

  return melhor?.config;
}

function nomesRelacionados(nome: string, config?: DisciplinaConfig) {
  const base = normalizarNomeDisciplina(nome);
  const relacionados = new Set<string>([base]);
  config?.aliases?.forEach((alias) => {
    relacionados.add(normalizarNomeDisciplina(alias));
  });
  config?.keywords?.forEach((keyword) => {
    relacionados.add(normalizarNomeDisciplina(keyword));
  });
  return relacionados;
}

function filtrarFallbackPorDisciplina(nome: string, config?: DisciplinaConfig) {
  const relacionados = nomesRelacionados(nome, config);
  return bnccFallback.filter((item) =>
    item.componentes.some((disciplina) =>
      relacionados.has(normalizarNomeDisciplina(disciplina))
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
    "dados",
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
  config?: DisciplinaConfig,
  etapaPadrao?: "EM" | "EF"
): BnccObjetivo[] {
  const collection = extrairColecao(payload);

  const etapaFallback =
    etapaPadrao ?? (config?.preferencia === "fundamental" ? "EF" : "EM");
  const areaPadrao = config?.area;

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
        (item as any).etapa ||
        (item as any).etapa_ensino ||
        (item as any).etapaEnsino ||
        etapaFallback;
      const area = (item as any).area || (item as any).areaConhecimento;

      return {
        codigo: String(codigo).trim(),
        descricao: String(descricao).trim(),
        etapa: etapa ? String(etapa).trim() : etapaFallback,
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

function extrairNumeroSerie(serie?: string | null) {
  if (!serie) return undefined;
  const normalizado = normalizarNomeDisciplina(serie);

  const extenso: Record<string, number> = {
    primeiro: 1,
    primeira: 1,
    segundo: 2,
    segunda: 2,
    terceiro: 3,
    terceira: 3,
    quarto: 4,
    quarta: 4,
    quinto: 5,
    quinta: 5,
    sexto: 6,
    sexta: 6,
    setimo: 7,
    setima: 7,
    oitavo: 8,
    oitava: 8,
    nono: 9,
    nona: 9,
  };

  for (const [palavra, numero] of Object.entries(extenso)) {
    if (normalizado.includes(palavra)) {
      return numero;
    }
  }

  const match = normalizado.match(/(\d{1,2})/);
  if (match) {
    return Number.parseInt(match[1], 10);
  }

  return undefined;
}

function inferirAnoSlug(serie?: string | null, etapa?: EtapaApi) {
  const numero = extrairNumeroSerie(serie);
  if (!numero) return undefined;

  const mapa: Record<number, string> = {
    1: "primeiro",
    2: "segundo",
    3: "terceiro",
    4: "quarto",
    5: "quinto",
    6: "sexto",
    7: "setimo",
    8: "oitavo",
    9: "nono",
  };

  if (etapa === "medio" && numero > 3) {
    return undefined;
  }

  if (etapa === "fundamental" && numero > 9) {
    return undefined;
  }

  return mapa[numero];
}

function inferirEtapas(
  serie?: string | null,
  config?: DisciplinaConfig
): EtapaApi[] {
  const ordem: EtapaApi[] = [];
  const texto = serie ? normalizarNomeDisciplina(serie) : "";
  const numero = extrairNumeroSerie(serie);

  const explicitoFundamental = /(fundamental|fund\.|ef)/.test(texto);
  const explicitoMedio = /(medio|ensino medio|\bem\b)/.test(texto);

  if (explicitoFundamental) {
    ordem.push("fundamental");
  }

  if (explicitoMedio) {
    ordem.push("medio");
  }

  if (numero !== undefined) {
    if (numero >= 4 && numero <= 9) {
      ordem.push("fundamental");
    }

    if (numero >= 1 && numero <= 3) {
      if (explicitoMedio) {
        ordem.push("medio");
      } else {
        ordem.push("fundamental");
        ordem.push("medio");
      }
    }

    if (numero > 9) {
      ordem.push("medio");
    }
  }

  if (config?.preferencia) {
    ordem.push(config.preferencia);
  }

  if (!ordem.includes("medio")) {
    ordem.push("medio");
  }

  if (!ordem.includes("fundamental")) {
    ordem.push("fundamental");
  }

  return ordem.filter((etapa, index) => ordem.indexOf(etapa) === index);
}

type TentativaApi = {
  url: string;
  etapa?: "EM" | "EF";
  etapaApi?: EtapaApi;
};

function construirTentativasApi(
  disciplina: string,
  config: DisciplinaConfig | undefined,
  contexto?: BnccBuscaContexto
): TentativaApi[] {
  const base = DEFAULT_API_URL.replace(/\/$/, "");
  const tentativas: TentativaApi[] = [];
  const etapas = inferirEtapas(contexto?.serie, config);

  etapas.forEach((etapa) => {
    const slug = config?.slugs?.[etapa];
    const prefixo = etapa === "medio" ? "bncc_medio" : "bncc_fundamental";
    const etapaPadrao = etapa === "medio" ? "EM" : "EF";
    const anoSlug = inferirAnoSlug(contexto?.serie, etapa);

    if (slug) {
      if (anoSlug) {
        tentativas.push({
          url: `${base}/${prefixo}/disciplina/${slug}/${anoSlug}/info_habilidades/`,
          etapa: etapaPadrao,
          etapaApi: etapa,
        });
        tentativas.push({
          url: `${base}/${prefixo}/disciplina/${slug}/${anoSlug}/`,
          etapa: etapaPadrao,
          etapaApi: etapa,
        });
      }

      tentativas.push({
        url: `${base}/${prefixo}/disciplina/${slug}/info_habilidades/`,
        etapa: etapaPadrao,
        etapaApi: etapa,
      });

      tentativas.push({
        url: `${base}/${prefixo}/disciplina/${slug}/`,
        etapa: etapaPadrao,
        etapaApi: etapa,
      });

      tentativas.push({
        url: `${base}/${prefixo}/${slug}/info_habilidades/`,
        etapa: etapaPadrao,
        etapaApi: etapa,
      });

      tentativas.push({
        url: `${base}/${prefixo}/${slug}/`,
        etapa: etapaPadrao,
        etapaApi: etapa,
      });
    }

    tentativas.push({
      url: `${base}/${prefixo}/`,
      etapa: etapaPadrao,
      etapaApi: etapa,
    });
  });

  const unico = new Map<string, TentativaApi>();
  tentativas
    .filter((tentativa) => !tentativa.url.includes("undefined"))
    .forEach((tentativa) => {
      if (!unico.has(tentativa.url)) {
        unico.set(tentativa.url, tentativa);
      }
    });

  return Array.from(unico.values());
}

const DEFAULT_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent": "EducacaoSaaS/1.0 (+https://educacao-saas.local)",
};

async function requisitar(url: string, redirectCount = 0): Promise<unknown> {
  if (redirectCount > 3) {
    throw new Error("Limite de redirecionamentos da API da BNCC excedido.");
  }

  if (typeof fetch === "function") {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Redirecionamento inválido recebido da API da BNCC.");
      }
      const absolute = new URL(location, url).toString();
      return requisitar(absolute, redirectCount + 1);
    }

    if (!response.ok) {
      throw new Error(
        `Resposta inesperada da API da BNCC: ${response.status}`
      );
    }

    if (response.status === 204) {
      return [];
    }

    return response.json();
  }

  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === "https:";
      const transport = isHttps ? https : http;

      const request = transport.request(
        {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: `${parsed.pathname}${parsed.search}`,
          method: "GET",
          headers: DEFAULT_HEADERS,
        },
        (response) => {
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            response.resume();
            const nextUrl = new URL(response.headers.location, url).toString();
            requisitar(nextUrl, redirectCount + 1)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (!response.statusCode || response.statusCode >= 400) {
            response.resume();
            reject(
              new Error(
                `Resposta inesperada da API da BNCC: ${response.statusCode}`
              )
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
        }
      );

      request.setTimeout(7000, () => {
        request.destroy(new Error("Tempo limite ao consultar a API da BNCC."));
      });

      request.on("error", reject);
      request.end();
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

  const nomesValidos = nomesRelacionados(disciplina, config);
  const areaEsperada = config?.area;

  return objetivos.filter((objetivo) => {
    const codigoNormalizado = objetivo.codigo.trim().toUpperCase();
    const disciplinasConhecidas = codigoParaDisciplinas.get(codigoNormalizado);

    const pertenceAoFallback = disciplinasConhecidas
      ? Array.from(nomesValidos).some((nome) => disciplinasConhecidas.has(nome))
      : true;

    if (!pertenceAoFallback) {
      return false;
    }

    if (areaEsperada && objetivo.area) {
      const areaNormalizada = removerAcentos(objetivo.area)
        .toUpperCase()
        .replace(/\s+/g, "_");
      if (
        areaNormalizada !== areaEsperada &&
        !areaNormalizada.includes(areaEsperada)
      ) {
        return false;
      }
    }

    return true;
  });
}

type ResultadoApi = {
  objetivos: BnccObjetivo[];
  etapa?: "EM" | "EF";
};

async function buscarNaApi(
  disciplina: string,
  config: DisciplinaConfig | undefined,
  contexto?: BnccBuscaContexto
): Promise<ResultadoApi> {
  const tentativas = construirTentativasApi(disciplina, config, contexto);

  for (const tentativa of tentativas) {
    try {
      const payload = await requisitar(tentativa.url);
      const objetivos = extrairObjetivos(payload, config, tentativa.etapa);
      if (objetivos.length) {
        const filtrados = filtrarPorDisciplina(
          objetivos,
          disciplina,
          config
        );
        if (filtrados.length) {
          return { objetivos: filtrados, etapa: tentativa.etapa };
        }
      }
    } catch (error) {
      console.warn(
        `Falha ao consultar a API da BNCC (${tentativa.url}):`,
        (error as Error).message
      );
    }
  }

  return { objetivos: [] };
}

function gerarChaveCache(
  disciplina: string,
  contexto?: BnccBuscaContexto
): string {
  const disciplinaNormalizada = normalizarNomeDisciplina(disciplina);
  const serieNormalizada = contexto?.serie
    ? normalizarNomeDisciplina(contexto.serie)
    : "sem-serie";
  return `${disciplinaNormalizada}|${serieNormalizada}`;
}

function ordenarObjetivos(objetivos: BnccObjetivo[]) {
  return objetivos
    .slice()
    .sort((a, b) =>
      a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true, sensitivity: "base" })
    );
}

export async function obterObjetivosBnccPorDisciplina(
  disciplina: string,
  contexto?: BnccBuscaContexto
): Promise<BnccObjetivo[]> {
  const cacheKey = gerarChaveCache(disciplina, contexto);
  const cacheEntry = disciplinaCache.get(cacheKey);
  const cacheValidoApi =
    cacheEntry?.origem === "api" &&
    Date.now() - cacheEntry.atualizadoEm < CACHE_TTL_MS;
  const cacheValidoFallback =
    cacheEntry?.origem === "fallback" &&
    Date.now() - cacheEntry.atualizadoEm < CACHE_TTL_MS;

  if (cacheValidoApi) {
    return cacheEntry!.objetivos;
  }

  const config = obterConfigDisciplina(disciplina);
  const resultadoApi = await buscarNaApi(disciplina, config, contexto);
  if (resultadoApi.objetivos.length > 0) {
    const objetivosOrdenados = ordenarObjetivos(resultadoApi.objetivos);
    disciplinaCache.set(cacheKey, {
      objetivos: objetivosOrdenados,
      origem: "api",
      atualizadoEm: Date.now(),
    });
    return objetivosOrdenados;
  }

  if (cacheValidoFallback) {
    return cacheEntry!.objetivos;
  }

  const fallback = filtrarFallbackPorDisciplina(disciplina, config).map(
    ({ codigo, descricao, etapa, area }) => ({
      codigo,
      descricao,
      etapa,
      area,
    })
  );

  if (fallback.length > 0) {
    const objetivosOrdenados = ordenarObjetivos(fallback);
    disciplinaCache.set(cacheKey, {
      objetivos: objetivosOrdenados,
      origem: "fallback",
      atualizadoEm: Date.now(),
    });
    return objetivosOrdenados;
  }

  const generico = bnccFallback.map(({ codigo, descricao, etapa, area }) => ({
    codigo,
    descricao,
    etapa,
    area,
  }));

  const objetivosOrdenados = ordenarObjetivos(generico);
  disciplinaCache.set(cacheKey, {
    objetivos: objetivosOrdenados,
    origem: "fallback",
    atualizadoEm: Date.now(),
  });
  return objetivosOrdenados;
}
