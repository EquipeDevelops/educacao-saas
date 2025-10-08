import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("A variável de ambiente GEMINI_API_KEY não foi definida.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Quebra o texto em várias linhas para caber em uma largura definida na página PDF.
 */
const wrapText = (
  text: string,
  width: number,
  font: any,
  size: number
): string[] => {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (const word of words) {
    const testLine = line + (line === "" ? "" : " ") + word;
    const testWidth = font.widthOfTextAtSize(testLine, size);

    if (testWidth > width) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  return lines;
};

export const geradorProvaIAService = {
  /**
   * Gera uma prova completa em formato PDF com base em um prompt.
   * @param prompt A descrição da prova solicitada pelo professor.
   * @returns Uma promessa que resolve para um Uint8Array contendo os bytes do PDF.
   */
  async gerarProva(prompt: string): Promise<Uint8Array> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const fullPrompt = `
      Você é um assistente especialista em criar provas.
      Sua tarefa é gerar o conteúdo de uma prova com base na solicitação do usuário.
      A sua resposta DEVE ser um objeto JSON contendo duas chaves: "theme" (o tema principal da prova) e "content" (o texto completo da prova, já formatado com quebras de linha \\n para perguntas, alternativas e espaços).

      Exemplo de resposta JSON:
      {
        "theme": "Ciclo da Água",
        "content": "Prova de Ciências - Ciclo da Água\\n\\nNome:________________\\nData:____/____/______\\n\\n1. Qual é o processo pelo qual a água se transforma em vapor?\\n(A) Condensação\\n(B) Evaporação\\n(C) Precipitação\\n\\n2. Descreva o que acontece durante a fase de condensação no ciclo da água.\\n_________________________________________________________________\\n_________________________________________________________________\\n\\n3. Marque V para Verdadeiro e F para Falso:\\n( ) A neve é uma forma de precipitação.\\n( ) Os rios não fazem parte do ciclo da água."
      }

      REGRAS IMPORTANTES:
      1. A resposta deve ser um JSON válido e nada mais.
      2. O "content" deve ser uma única string, usando "\\n" para criar novas linhas.
      3. Crie espaços para o nome do aluno e a data.
      4. Inclua diferentes tipos de questões se o prompt permitir (múltipla escolha, discursivas, V/F, etc.).

      Solicitação do usuário: "${prompt}"
    `;

    console.log("[IA Service] Gerando conteúdo com o prompt...");
    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();
    console.log("[IA Service] Resposta bruta da IA recebida.");

    let theme = "Prova Gerada por IA";
    let content = "Não foi possível gerar o conteúdo.";

    try {
      const cleanedResponse = responseText
        .trim()
        .replace(/^```json\s*|```$/g, "");
      const examData = JSON.parse(cleanedResponse);
      theme = examData.theme || theme;
      content = examData.content || content;
    } catch (error) {
      console.error(
        "[IA Service] Erro ao fazer o parse do JSON da IA. Usando resposta como texto plano.",
        error
      );
      content = responseText;
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const margin = 50;
    const usableWidth = width - 2 * margin;

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

    pdfDoc.setTitle(theme);

    let y = height - margin;

    const contentLines = content.split("\n");

    for (const line of contentLines) {
      if (y < margin + 40) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = height - margin;
      }

      const wrappedLines = wrapText(line, usableWidth, helveticaFont, 12);

      for (const wrappedLine of wrappedLines) {
        page.drawText(wrappedLine, {
          x: margin,
          y,
          font: helveticaFont,
          size: 12,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
    }

    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      pages[i].drawText(`Página ${i + 1} de ${pages.length}`, {
        x: width / 2 - 30,
        y: 30,
        font: helveticaFont,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    console.log("[IA Service] PDF gerado com sucesso.");
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  },
};
