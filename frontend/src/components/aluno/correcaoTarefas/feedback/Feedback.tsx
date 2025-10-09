import { LuMessageCircle } from 'react-icons/lu';
import styles from './style.module.css'

interface FeedbackProps {
  title: string;
  content: string;
}

export default function Feedback({ content, title }: FeedbackProps) {
  return (
    <div className={styles.feedbackContainer}>
      <h2>
        <LuMessageCircle /> {title}
      </h2>
      <p>{content}</p>
    </div>
  );
}
