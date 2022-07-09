import React, { useEffect } from 'react';
import { TempService } from 'apis/test';

const App: React.FunctionComponent = () => {
  useEffect(() => {
    TempService();
  }, []);
  return <div>successfully run starter kit</div>;
};

export default App;
