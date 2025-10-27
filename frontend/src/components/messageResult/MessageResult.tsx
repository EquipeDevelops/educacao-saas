import { IconType } from "react-icons";
import { PiPackageLight } from "react-icons/pi";
import styles from './styles.module.css'

interface MessageProps {
  message: string;
  icon?: IconType
}

export default function MessageResult({ message, icon: Icon }: MessageProps) {
  const SelectedIcon = Icon || PiPackageLight;

  return (
    <div className={styles.container}>
      <SelectedIcon/>
      <p>{message}</p>
    </div>
  );
}