import { IoAlertCircleOutline } from 'react-icons/io5';
import styles from './style.module.css';

export default function ErrorMsg({ text }: { text: string }) {
  return (
    <div className={styles.container}>
      <IoAlertCircleOutline /> <p>{text}</p>
    </div>
  );
}
