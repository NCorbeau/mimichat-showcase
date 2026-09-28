import ReactDOM from 'react-dom/client';
import 'monday-ui-react-core/tokens';
import 'monday-ui-react-core/dist/main.css';
import './App.scss';
import { ChatBoardRoot } from './ChatBoardRoot';

ReactDOM.createRoot(document.getElementById('root')!).render(<ChatBoardRoot />);
