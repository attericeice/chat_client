import router from "./router";
import { RouterProvider } from 'react-router-dom';
import { setupStore } from "./store";
import { Provider } from 'react-redux';
import { HelmetProvider } from "react-helmet-async";
import './assets/styles/global.scss';

const store = setupStore();

function App() {
  return (
    <HelmetProvider>
    <Provider store={store}>
      <RouterProvider router={router}/>
    </Provider>
    </HelmetProvider>
  );
}

export default App;
