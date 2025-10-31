import Link from 'next/link';
import { MensagemRecente } from '@/types/statusAluno';
import { LuMessagesSquare, LuSquareArrowOutUpRight } from 'react-icons/lu';
import styles from './style.module.css';

interface MensagensRecentesProps {
  mensagens: MensagemRecente[];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const nameParts = name.trim().split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  return (
    nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function MensagensRecentes({
  mensagens = [],
}: MensagensRecentesProps) {
  console.log(mensagens);
  

  return (
    <div className={styles.container}>
      <h2>
        <span></span>Mensagens Recentes
      </h2>
      <div className={styles.list}>
        {mensagens.length > 0 ? (
          mensagens.map((msg) => {
            return (
              <>
                {msg.ultimaMensagem !== 'Nenhuma mensagem ainda.' ? (
                  <Link
                    key={msg.id}
                    href={`/aluno/mensagens?conversaId=${msg.id}`}
                    className={styles.item}
                  >
                    <div className={styles.avatar}>
                      {getInitials(msg.nomeOutraPessoa)}
                    </div>
                    <div className={styles.content}>
                      <div className={styles.info}>
                        <span className={styles.nome}>
                          {msg.papelUsuarioMensagem === 'PROFESSOR'
                            ? 'Prof. '
                            : ''}
                          {msg.nomeOutraPessoa}
                        </span>
                        <span className={styles.data}>
                          {new Date(msg.dataUltimaMensagem).toLocaleDateString(
                            'pt-BR',
                            { day: '2-digit', month: '2-digit' },
                          )}
                        </span>
                      </div>
                      <p className={styles.mensagem}>{msg.ultimaMensagem}</p>
                    </div>
                  </Link>
                ) : (
                  ''
                )}
              </>
            );
          })
        ) : (
          <p className={styles.semMensagens}>Nenhuma mensagem recente.</p>
        )}
      </div>
      <Link href={'/aluno/mensagens'} className={styles.buttonLink}>
        Ver todas as mensagens <LuSquareArrowOutUpRight />
      </Link>
    </div>
  );
}
