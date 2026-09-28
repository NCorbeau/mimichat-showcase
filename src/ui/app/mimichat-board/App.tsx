import './App.scss';
import 'monday-ui-react-core/tokens';
import "monday-ui-react-core/dist/main.css";
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Auth } from '../../Auth';
import { ChatBoardRoot } from './ChatBoardRoot';

function App() {

  const router = createBrowserRouter([
    {
      path: '/',
      element: <ChatBoardRoot />
    },
    {
      path: '/auth',
      element: <Auth />
    }
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;