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

type ContextoHabilidade = {
  etapa?: unknown;
  area?: unknown;
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

function extrairColecao(
  payload: unknown,
  visitados: WeakSet<object> = new WeakSet()
): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (visitados.has(payload)) {
    return [];
  }

  visitados.add(payload);

  const candidates = [
    "results",
    "habilidades",
    "info_habilidades",
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

  const arraysDiretos = Object.values(payload as Record<string, unknown>).filter(
    (value) => Array.isArray(value)
  );
  if (arraysDiretos.length) {
    return arraysDiretos.flat() as any[];
  }

  const nested = Object.values(payload as Record<string, unknown>).flatMap(
    (value) => {
      if (!value || typeof value !== "object") {
        return [];
      }

      const collection = extrairColecao(value, visitados);
      return collection.length ? collection : [];
    }
  );

  return nested;
}

function extrairCodigoEDescricaoDeString(valor: string) {
  const texto = String(valor).trim();
  const match = texto.match(/\(?\s*([A-Z]{2}\d{2,}[A-Z0-9]*)\)?\s*-?\s*(.+)?/);
  if (match) {
    const [, codigo, descricao] = match;
    const restante = (descricao ?? "").trim();
    return {
      codigo: codigo?.trim() ?? "",
      descricao: restante || texto,
    };
  }

  return { codigo: "", descricao: texto };
}

function coagirParaArray<T>(valor: T | T[] | null | undefined) {
  if (Array.isArray(valor)) {
    return valor as T[];
  }

  if (valor === null || valor === undefined) {
    return [] as T[];
  }

  return [valor as T];
}

function expandirCodigosHabilidadeObjeto(
  entrada: any,
  contexto: ContextoHabilidade
) {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return [] as any[];
  }

  const codigos = coagirParaArray(
    (entrada as any).nome_codigo ||
      (entrada as any).codigo ||
      (entrada as any).codigos ||
      (entrada as any).codigo_habilidade ||
      (entrada as any).codigoHabilidade
  ).map((codigo) => String(codigo ?? "").trim());

  const descricoes = coagirParaArray(
    (entrada as any).nome_habilidade ||
      (entrada as any).descricao ||
      (entrada as any).descricao_habilidade ||
      (entrada as any).habilidade ||
      (entrada as any).habilidades
  ).map((descricao) => String(descricao ?? "").trim());

  if (!codigos.length) {
    return [] as any[];
  }

  return codigos
    .map((codigo, index) => {
      const descricaoBruta =
        descricoes[index] ??
        descricoes[descricoes.length - 1] ??
        (entrada as any).descricao ??
        (entrada as any).nome_habilidade ??
        (entrada as any).habilidade ??
        "";

      const codigoNormalizado = String(codigo ?? "").trim();
      const descricaoNormalizada = String(descricaoBruta ?? "").trim();

      if (!codigoNormalizado) {
        return null;
      }

      return {
        codigo: codigoNormalizado,
        descricao: descricaoNormalizada || codigoNormalizado,
        etapa: contexto.etapa,
        area: contexto.area,
      } satisfies Partial<BnccObjetivo>;
    })
    .filter((item): item is Partial<BnccObjetivo> => Boolean(item?.codigo));
}

function normalizarEntradaHabilidade(
  habilidade: any,
  contexto: ContextoHabilidade
) {
  if (typeof habilidade === "string") {
    const { codigo, descricao } = extrairCodigoEDescricaoDeString(habilidade);

    return {
      codigo,
      descricao,
      etapa: contexto.etapa,
      area: contexto.area,
    } satisfies Partial<BnccObjetivo>;
  }

  if (!habilidade || typeof habilidade !== "object") {
    return habilidade;
  }

  return {
    ...habilidade,
    etapa:
      habilidade?.etapa ||
      habilidade?.etapa_ensino ||
      habilidade?.etapaEnsino ||
      habilidade?.segmento ||
      contexto.etapa,
    area:
      habilidade?.area ||
      habilidade?.areaConhecimento ||
      habilidade?.area_conhecimento ||
      contexto.area,
  };
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

  const expandido = collection.flatMap((item) => {
    if (!item || typeof item !== "object") return [] as any[];

    const habilidadesDiretas = (item as any).habilidades;
    const habilidadesAno = (item as any).habilidadesAno;
    const infoHabilidades = (item as any).info_habilidades;
    const codigosHabilidade =
      (item as any).codigo_habilidade ||
      (item as any).codigoHabilidade ||
      (item as any).codigoHabilidades;

    const contexto: ContextoHabilidade = {
      etapa:
        (item as any).etapa ||
        (item as any).etapa_ensino ||
        (item as any).etapaEnsino ||
        (item as any).segmento ||
        (item as any).nivel ||
        (item as any).modalidade,
      area:
        (item as any).area ||
        (item as any).areaConhecimento ||
        (item as any).area_conhecimento ||
        (item as any).campo ||
        (item as any).campo_experiencia,
    };

    let candidato =
      Array.isArray(habilidadesDiretas)
        ? habilidadesDiretas
        : Array.isArray(habilidadesAno)
        ? habilidadesAno
        : Array.isArray(infoHabilidades)
        ? infoHabilidades
        : Array.isArray(codigosHabilidade)
        ? codigosHabilidade
        : null;

    if (!candidato && codigosHabilidade) {
      const expandido = expandirCodigosHabilidadeObjeto(
        codigosHabilidade,
        contexto
      );
      if (expandido.length) {
        candidato = expandido;
      }
    }

    if (candidato) {
      return candidato.map((habilidade: any) =>
        normalizarEntradaHabilidade(habilidade, contexto)
      );
    }

    return [item];
  });

  const objetivos = expandido
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const codigo =
        (item as any).codigo ||
        (item as any).codigo_habilidade ||
        (item as any).codigoHabilidade ||
        (item as any).cod_habilidade ||
        (item as any).codigoHabilidadeBNCC ||
        (item as any).codigo_habilidade_bncc ||
        (item as any).codigo_hab ||
        (item as any).nome_codigo ||
        (item as any).nomeCodigo ||
        (item as any).codigoBncc ||
        (item as any).codigoBNCC;
      const descricao =
        (item as any).descricao ||
        (item as any).habilidade ||
        (item as any).descricao_habilidade ||
        (item as any).texto ||
        (item as any).habilidadeBNCC ||
        (item as any).descricaoHabilidade ||
        (item as any).descricao_habilidade_bncc ||
        (item as any).descricao_objetivo ||
        (item as any).nome_habilidade ||
        (item as any).nomeHabilidade;

      if (!codigo || !descricao) return null;

      const etapaRaw =
        (item as any).etapa ||
        (item as any).etapa_ensino ||
        (item as any).etapaEnsino ||
        (item as any).segmento ||
        (item as any).nivel ||
        (item as any).modalidade;
      const areaRaw =
        (item as any).area ||
        (item as any).areaConhecimento ||
        (item as any).area_conhecimento ||
        (item as any).areaConhecimentoBNCC ||
        (item as any).campo ||
        (item as any).campo_experiencia;

      const etapaNormalizada = (() => {
        if (!etapaRaw) return etapaFallback;
        const valor = String(etapaRaw).toLowerCase();
        if (/(medio|em|ensino medio)/.test(valor)) return "EM" as const;
        if (/(fundamental|ef|fund\.)/.test(valor)) return "EF" as const;
        return etapaFallback;
      })();

      const codigoNormalizado = String(codigo).trim();
      const descricaoNormalizada = String(descricao).trim();

      if (!codigoNormalizado || !descricaoNormalizada) return null;

      return {
        codigo: codigoNormalizado,
        descricao: descricaoNormalizada,
        etapa: etapaNormalizada,
        area: areaRaw ? String(areaRaw).trim() : areaPadrao,
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
  const siglaPreferida = inferirSiglaSerie(serie);

  const explicitoFundamental = /(fundamental|fund\.|ef)/.test(texto);
  const explicitoMedio = /(medio|ensino medio|\bem\b)/.test(texto);

  const push = (etapa: EtapaApi) => {
    if (!ordem.includes(etapa)) {
      ordem.push(etapa);
    }
  };

  if (explicitoFundamental) {
    push("fundamental");
  }

  if (explicitoMedio) {
    push("medio");
  }

  if (numero !== undefined) {
    if (numero >= 6 && numero <= 9) {
      push("fundamental");
    } else if (numero >= 4 && numero <= 5) {
      push("fundamental");
    } else if (numero >= 1 && numero <= 3) {
      if (explicitoFundamental) {
        push("fundamental");
      } else {
        push("medio");
      }
    } else if (numero > 9) {
      push("medio");
    }
  }

  if (siglaPreferida === "EF") {
    push("fundamental");
  } else if (siglaPreferida === "EM") {
    push("medio");
  }

  if (config?.preferencia) {
    push(config.preferencia);
  }

  if (!ordem.includes("medio")) {
    push("medio");
  }

  if (!ordem.includes("fundamental")) {
    push("fundamental");
  }

  return ordem;
}

function inferirEtapaPrincipal(
  serie?: string | null,
  config?: DisciplinaConfig
): EtapaApi | undefined {
  const [primeira] = inferirEtapas(serie, config);
  return primeira;
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
        tentativas.push({
          url: `${base}/${prefixo}/${slug}/${anoSlug}/info_habilidades/`,
          etapa: etapaPadrao,
          etapaApi: etapa,
        });
        tentativas.push({
          url: `${base}/${prefixo}/${slug}/${anoSlug}/`,
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

function etapaApiParaSigla(
  etapa?: EtapaApi
): "EM" | "EF" | undefined {
  if (!etapa) return undefined;
  return etapa === "medio" ? "EM" : "EF";
}

const DEFAULT_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Referer: "https://cientificar1992.pythonanywhere.com/visualizarBncc/",
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

function filtrarPorEtapa(
  objetivos: BnccObjetivo[],
  etapa?: "EM" | "EF"
) {
  if (!etapa || !objetivos.length) {
    return objetivos;
  }

  const prefixo = etapa.toUpperCase();

  return objetivos.filter((objetivo) => {
    const codigo = objetivo.codigo.trim().toUpperCase();
    if (codigo.startsWith(prefixo)) {
      return true;
    }

    if (objetivo.etapa) {
      const etapaNormalizada = objetivo.etapa.trim().toUpperCase();
      if (etapaNormalizada.startsWith(prefixo)) {
        return true;
      }
    }

    return false;
  });
}

function inferirSiglaSerie(serie?: string | null): "EM" | "EF" | undefined {
  if (!serie) {
    return undefined;
  }

  const texto = normalizarNomeDisciplina(serie);

  if (/(fundamental|fund\.|ef\b|ef\s|ef1|ef ii|anos finais)/.test(texto)) {
    return "EF";
  }

  if (/(ensino medio|medio|\bem\b)/.test(texto)) {
    return "EM";
  }

  const numero = extrairNumeroSerie(serie);
  if (numero === undefined) {
    return undefined;
  }

  if (numero >= 6 && numero <= 9) {
    return "EF";
  }

  if (numero >= 4 && numero <= 5) {
    return "EF";
  }

  if (numero >= 1 && numero <= 3) {
    return "EM";
  }

  if (numero > 9) {
    return "EM";
  }

  return undefined;
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
  const etapaPrincipal = inferirEtapaPrincipal(contexto?.serie, config);
  const etapaPreferidaSigla = etapaApiParaSigla(etapaPrincipal);
  const siglaSeriePreferida = inferirSiglaSerie(contexto?.serie);

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
          const etapaResposta =
            tentativa.etapa ?? etapaPreferidaSigla ?? undefined;
          const etapaFiltrada = siglaSeriePreferida ?? etapaResposta;
          const porEtapa = filtrarPorEtapa(filtrados, etapaFiltrada);
          if (porEtapa.length) {
            return { objetivos: porEtapa, etapa: etapaFiltrada };
          }
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
  const etapaPrincipal = inferirEtapaPrincipal(contexto?.serie, config);
  const etapaSiglaPreferida = etapaApiParaSigla(etapaPrincipal);
  const siglaDerivadaDaSerie = inferirSiglaSerie(contexto?.serie);
  const siglaParaFallback = siglaDerivadaDaSerie ?? etapaSiglaPreferida;
  const resultadoApi = await buscarNaApi(disciplina, config, contexto);
  if (resultadoApi.objetivos.length > 0) {
    const combinados = new Map<string, BnccObjetivo>();
    resultadoApi.objetivos.forEach((objetivo) => {
      const chave = objetivo.codigo.trim();
      if (!combinados.has(chave)) {
        combinados.set(chave, objetivo);
      }
    });

    const objetivosOrdenados = ordenarObjetivos(Array.from(combinados.values()));
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

  const fallback = filtrarPorEtapa(
    filtrarFallbackPorDisciplina(disciplina, config).map(
      ({ codigo, descricao, etapa, area }) => ({
        codigo,
        descricao,
        etapa,
        area,
      })
    ),
    siglaParaFallback
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

  const generico = filtrarPorEtapa(
    bnccFallback.map(({ codigo, descricao, etapa, area }) => ({
      codigo,
      descricao,
      etapa,
      area,
    })),
    siglaParaFallback
  );

  const objetivosOrdenados = ordenarObjetivos(generico);
  disciplinaCache.set(cacheKey, {
    objetivos: objetivosOrdenados,
    origem: "fallback",
    atualizadoEm: Date.now(),
  });
  return objetivosOrdenados;
}
