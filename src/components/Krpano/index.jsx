import React, { useEffect, useState } from 'react';
import useKrpano from 'react-krpano-hooks';

export const Krpano = ({ scene }) => {
  const [sceneKrpano, setSceneKrpano] = useState(scene);
  const { containerRef, getKrpano, callKrpano } = useKrpano({
    width: '100%',
    height: '100%',
    xml: '/krpano/tour.xml', // Ruta al archivo XML
    embeddingParams: {
      mwheel: false,
    },
    globalFunctions: {
      nameScene: (scene) => {
        setSceneKrpano(scene);
      },
    },
  });

  // Cambiar la escena cuando el componente se monta o cuando cambia el parámetro `scene`
  useEffect(() => {
    if (getKrpano && scene) {
      callKrpano(`loadscene(${scene}, null, BLEND(1));`); // Cambiar a la escena especificada
    }else{
        console.log('No hay krpano o escena');
    }
  }, [getKrpano, scene, callKrpano, sceneKrpano]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
};