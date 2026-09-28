import './App.scss';
import 'monday-ui-react-core/tokens';
import "monday-ui-react-core/dist/main.css";
import { MimichatRoot } from './MimichatRoot';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Auth } from '../../Auth';


function App() {

  const router = createBrowserRouter([
    {
      path: '/',
      element: <MimichatRoot />
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