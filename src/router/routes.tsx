import type  { RouteObject } from "react-router-dom";
import { lazy } from 'react';
import AuthLayot from "../HOC/AuthLayot";
import MainLayout from "../HOC/MainLayout";
import EmptyChat from "../components/EmptyChat";
import LazyComponent from "../shared/UI/LazyComponent";
import CircleLoader from "../shared/UI/CircleLoader";
import DotsLoader from "../shared/UI/DotsLoader";
const DialogPage = lazy(() => import('../pages/DialogPage'));
const Chat = lazy(() => import('../modules/Chat'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsProfile = lazy(() => import('../components/SettingsProfile'));
const SettingsParams = lazy(() => import('../components/SettingsParams'));
const SettingsMedia = lazy(() => import('../components/SettingsMedia'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const SettingsBlackList = lazy(() => import('../components/SettingsBlackList'));
const ProfileMediaList = lazy(() => import('../components/ProfileMediaList'));
const ProfileDocumentList = lazy(() => import('../components/ProfileDocumentList'));
const ProfileVoices = lazy(() => import('../components/ProfileVoices'));
const RegistrationPage = lazy(() => import('../pages/RegistrationPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));


const defaultRoutes : RouteObject[] = [
    {path: '/account/login', element: <LazyComponent loader={<div className="pageLoader"><DotsLoader /></div>}>
    <LoginPage />
    </LazyComponent>},
    {path: '/account/registration', element: <LazyComponent loader={<div className="pageLoader"><DotsLoader /></div>}>
    <RegistrationPage />
    </LazyComponent>},
    {path: '*', element: <LazyComponent loader={<div className="pageLoader"></div>}><NotFoundPage /></LazyComponent>}
]

const authorizedRoutes : RouteObject = {
Component: AuthLayot,
children: [
{
path: '/', element: <LazyComponent loader={<div className="pageLoader"><DotsLoader /></div>}><DialogPage /></LazyComponent>, 
children: [
{path: '/', Component: EmptyChat},
{path: '/dialog/:id', element: <LazyComponent 
loader={<div className="tabLoader"><CircleLoader size={70}/></div>}><Chat /></LazyComponent>}
]},
{
    path: '/profile/:link', element: <LazyComponent loader={<div className="pageLoader"><DotsLoader /></div>}><ProfilePage /></LazyComponent>,
    children: [
      {index: true, element: <LazyComponent loader={<DotsLoader />}><ProfileMediaList /></LazyComponent>},
      {path: 'documents', element:<LazyComponent loader={<DotsLoader />}><ProfileDocumentList /></LazyComponent>},
      {path: 'voices', element: <LazyComponent loader={<DotsLoader />}><ProfileVoices /></LazyComponent>}
    ]
},
{
    path: '/settings', element: <LazyComponent loader={<div className="pageLoader">
    <DotsLoader />
    </div>}><SettingsPage /></LazyComponent>,
    children: [
      {index: true,  element: <LazyComponent loader={<div className="tabLoader"><DotsLoader /></div>}><SettingsProfile /></LazyComponent>},
      {path: 'params', element: <LazyComponent loader={<div className="tabLoader"><DotsLoader /></div>}><SettingsParams /></LazyComponent>},
      {path: 'media', element: <LazyComponent loader={<div className="tabLoader"><DotsLoader /></div>}><SettingsMedia /></LazyComponent>},
      {path: 'blacklist', element: <LazyComponent loader={<div className="tabLoader"><DotsLoader /></div>}><SettingsBlackList /></LazyComponent>}
    ],
}
]};

    


const routes : RouteObject[] = [
    {
        Component: MainLayout,
        children: [
           ...defaultRoutes,
           authorizedRoutes, 
        ],
    },
];

export default routes;