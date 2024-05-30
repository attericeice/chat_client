
import cl from './ContentLoader.module.scss';

const ContentLoader = () => {
  return (
    <div className={cl.contentLoader}>
        <div className={cl.barOne}></div>
        <div className={cl.barTwo}></div>
        <div className={cl.barThree}></div>
        <div className={cl.barFour}></div>
        <div className={cl.barFive}></div>
        <div className={cl.barSix}></div>
    </div>
  )
}

export default ContentLoader