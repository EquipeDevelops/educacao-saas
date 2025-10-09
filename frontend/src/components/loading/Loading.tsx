import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { VscMortarBoard } from 'react-icons/vsc';
import styles from './styles.module.css';

export default function Loading() {
  return (
    <div className={styles.containerLoading}>
      <div>
        <AiOutlineLoading3Quarters className={styles.loadingIcon} />
        <VscMortarBoard className={styles.marcaIcon} />
      </div>
    </div>
  );
}
