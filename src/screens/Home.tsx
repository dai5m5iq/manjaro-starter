import './home.css';
import React, { Suspense, useEffect, useState } from 'react';
import {
  Text, Flex, VStack, CircularProgress, useColorMode,
  Button, useColorModeValue, ButtonGroup,
  Switch, FormControl, FormLabel,
} from '@chakra-ui/react';
import { Step, Steps, useSteps } from 'chakra-ui-steps';
import { FiPackage, FiHome } from 'react-icons/fi';
import { GiSettingsKnobs } from 'react-icons/gi';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { copyFile, removeFile } from '@tauri-apps/api/fs';
import { resolveResource, configDir } from '@tauri-apps/api/path';
import { useTranslation } from 'react-i18next';
import { forage } from '@tauri-apps/tauri-forage';
import StepButtons from '../components/StepButtons';
import HomeContent from '../components/HomeContent';
import PackagesView from '../components/PackageRelated/Packages';
import ResultComponent from '../components/ResultComponent';
import SystemConfig from '../components/SystemConfig';
import packageJson from '../../package.json';
import AboutComponent from '../components/AboutComponent';
import Nav from '../components/NavbarComponent';

interface AppProps {
}

const homeContent = (
  <Flex py={4}>
    <HomeContent />
  </Flex>
);
const PackageContent: React.FC<AppProps> = (props) => (
  <Flex py={4}>
    <Suspense fallback={<CircularProgress isIndeterminate color="green.300" />}>

      <PackagesView />
    </Suspense>
  </Flex>
);
const settingContent = (
  <Flex py={4}>
    <Suspense fallback={<CircularProgress isIndeterminate color="green.300" />}>

      <SystemConfig />
    </Suspense>
  </Flex>
);

const App: React.FC<AppProps> = (props) => {
  const { t } = useTranslation();
  const STEPCOUNT = 3;
  const [launch, setLaunch] = useState(false);
  const handleLaunchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setLaunch(event.target.checked);
    const configDirPath = await configDir();
    if (event.target.checked) {
      // localdata set
      forage.setItem({
        key: 'launchStart',
        value: 'true',
      })();
      // copy desktop file to autostart folder
      const resourcePath = await resolveResource('resources/manjaro-starter.desktop');
      await copyFile(resourcePath, `${configDirPath}autostart/manjaro-starter.desktop`);
    } else {
      // localdata set
      forage.setItem({
        key: 'launchStart',
        value: 'false',
      })();
      // remove desktop file from autostart folder
      await removeFile(`${configDirPath}autostart/manjaro-starter.desktop`);
    }
  };
  useEffect(() => {
    const getLocalData = async () => {
      const launchStart = await forage.getItem({ key: 'launchStart' })();
      if (launchStart) {
        setLaunch(launchStart === 'true');
      } else {
        forage.setItem({
          key: 'launchStart',
          value: 'false',
        })();
      }
    };
    getLocalData();
  }, []);
  const steps = [
    { label: t('welcome'), icon: FiHome, content: homeContent },
    { label: t('explorer'), icon: FiPackage, content: <PackageContent /> },
    { label: t('configurations'), icon: GiSettingsKnobs, content: settingContent },
  ];
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const {
    nextStep, prevStep, reset, activeStep,
  } = useSteps({
    initialStep: 0,
  });
  return (
    <>
      <Nav />
      <VStack mt={63}>
        <VStack width="100%">

          <Steps
            bg={bg}
            position="fixed"
            padding={5}
            boxShadow="sm"
            css={{
              backdropFilter: 'saturate(180%) blur(5px)',
              backgroundColor: useColorModeValue(
                'rgba(255, 255, 255, 0.8)',
                'rgba(26, 32, 44, 0.8)',
              ),
            }}
            activeStep={activeStep}
          >

            {steps.map(({ label, content, icon }) => (
              <Step label={label} key={label} icon={icon}>
                {content}
              </Step>
            ))}
          </Steps>

        </VStack>

        {activeStep === STEPCOUNT ? (
          <ResultComponent onReset={reset} />
        ) : (
          <Flex
            position="fixed"
            padding={5}
            bg={bg}
            bottom={0}
            w="100%"
            css={{
              backdropFilter: 'saturate(180%) blur(5px)',
              backgroundColor: useColorModeValue(
                'rgba(255, 255, 255, 0.8)',
                'rgba(26, 32, 44, 0.8)',
              ),
            }}
          >
            <FormControl display="flex" alignItems="center" ml={2}>
              <FormLabel htmlFor="launch-start" mb="0" fontSize="sm">
                {t('launchStart')}
              </FormLabel>
              <Switch isChecked={launch} onChange={handleLaunchChange} id="launch-start" />
            </FormControl>
            <ButtonGroup variant="outline" spacing="2">

              <Button onClick={toggleColorMode}>
                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              </Button>
              <AboutComponent />

            </ButtonGroup>

            <StepButtons
              {...{ nextStep, prevStep }}
              prevDisabled={activeStep === 0}
              isLast={activeStep === STEPCOUNT - 1}
            />
            <Text position="absolute" ml={3} fontSize="xs" mt={10} color="gray.500">
              {packageJson.version}
            </Text>

          </Flex>
        )}

      </VStack>
    </>

  );
};

export default App;
