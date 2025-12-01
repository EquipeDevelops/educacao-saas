import axios from "axios";
import { AppError } from "../../errors/AppError";

const BNCC_BASE_URL = "https://cientificar1992.pythonanywhere.com";

export class BnccService {
  async getHabilidades(stage: string, disciplina: string, ano: string) {
    let url = "";

    if (stage === "infantil") {
      url = `${BNCC_BASE_URL}/bncc_infantil/campo/${disciplina}/${ano}/info_habilidades/`;
    } else if (stage === "medio") {
      url = `${BNCC_BASE_URL}/bncc_medio/disciplina/${disciplina}/${ano}/info_habilidades/`;
    } else {
      url = `${BNCC_BASE_URL}/bncc_fundamental/disciplina/${disciplina}/${ano}/`;
    }

    console.log(`[BNCC Service] Buscando em: ${url}`);

    try {
      const response = await axios.get(url);
      const rawData = response.data;

      const habilidadesEncontradas = this.deepSearchSkills(rawData);

      const uniqueSkills = habilidadesEncontradas.filter(
        (skill, index, self) =>
          index ===
          self.findIndex((t) => t.codigo === skill.codigo && t.codigo !== "S/C")
      );

      console.log(
        `[BNCC Service] Sucesso! ${uniqueSkills.length} habilidades processadas.`
      );
      return uniqueSkills;
    } catch (error: any) {
      console.error(
        `[BNCC Service] Erro na requisição [${url}]:`,
        error.message
      );
      return [];
    }
  }

  private deepSearchSkills(node: any): any[] {
    let results: any[] = [];

    if (!node) return [];

    if (Array.isArray(node)) {
      for (const item of node) {
        results.push(...this.deepSearchSkills(item));
      }
      return results;
    }

    if (typeof node === "object") {
      if (node.codigo && typeof node.codigo === "string") {
        results.push({
          codigo: node.codigo,
          descricao:
            node.descricao ||
            node.habilidade ||
            node.nome_habilidade ||
            "Sem descrição",
        });
        return results;
      }

      if (node.habilidade && typeof node.habilidade === "string") {
        const parsed = this.parseSkillString(node.habilidade);
        if (parsed) results.push(parsed);
      }

      if (node.nome_habilidade && typeof node.nome_habilidade === "string") {
        const parsed = this.parseSkillString(node.nome_habilidade);
        if (parsed) results.push(parsed);
      }

      for (const key in node) {
        if (typeof node[key] === "object" || Array.isArray(node[key])) {
          results.push(...this.deepSearchSkills(node[key]));
        }
      }
    }

    return results;
  }

  private parseSkillString(text: string) {
    const matchParenteses = text.match(/^\(([A-Z0-9]+)\)\s*(.*)/);
    if (matchParenteses) {
      return { codigo: matchParenteses[1], descricao: matchParenteses[2] };
    }

    const matchTraco = text.match(
      /^([A-Z]{2}\d{2}[A-Z]{2}\d{2})\s*[-–]\s*(.*)/
    );
    if (matchTraco) {
      return { codigo: matchTraco[1], descricao: matchTraco[2] };
    }

    if (text.length > 10) {
      return { codigo: "S/C", descricao: text };
    }

    return null;
  }
}
