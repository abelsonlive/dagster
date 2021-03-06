import {QueryResult} from '@apollo/client';
import {NonIdealState} from '@blueprintjs/core';
import * as React from 'react';

import {PythonErrorInfo} from 'src/app/PythonErrorInfo';
import {InstanceHealthQuery} from 'src/instance/types/InstanceHealthQuery';
import {UnloadableSensors} from 'src/jobs/UnloadableJobs';
import {SensorInfo} from 'src/sensors/SensorInfo';
import {SensorsTable} from 'src/sensors/SensorsTable';
import {JobType} from 'src/types/globalTypes';
import {Box} from 'src/ui/Box';
import {Group} from 'src/ui/Group';
import {Loading} from 'src/ui/Loading';
import {Subheading} from 'src/ui/Text';
import {buildRepoAddress} from 'src/workspace/buildRepoAddress';

interface Props {
  queryData: QueryResult<InstanceHealthQuery>;
}

export const InstanceSensors = (props: Props) => {
  const {queryData} = props;

  return (
    <Loading queryResult={queryData} allowStaleData={true}>
      {(result) => {
        const {instance, repositoriesOrError, unloadableJobStatesOrError} = result;

        if (repositoriesOrError.__typename === 'PythonError') {
          return <PythonErrorInfo error={repositoriesOrError} />;
        }
        if (unloadableJobStatesOrError.__typename === 'PythonError') {
          return <PythonErrorInfo error={unloadableJobStatesOrError} />;
        }

        const unloadableJobs = unloadableJobStatesOrError.results;
        const withSensors = repositoriesOrError.nodes.filter(
          (repository) => repository.sensors.length,
        );

        const sensorDefinitionsSection = withSensors.length ? (
          <Group direction="column" spacing={32}>
            <SensorInfo daemonHealth={instance.daemonHealth} />
            {withSensors.map((repository) =>
              repository.sensors.length ? (
                <Group direction="column" spacing={12} key={repository.name}>
                  <Subheading>{`${repository.name}@${repository.location.name}`}</Subheading>
                  <SensorsTable
                    repoAddress={buildRepoAddress(repository.name, repository.location.name)}
                    sensors={repository.sensors}
                  />
                </Group>
              ) : null,
            )}
          </Group>
        ) : null;

        const unloadableSensors = unloadableJobs.filter(
          (state) => state.jobType === JobType.SENSOR,
        );
        const unloadableSensorsSection = unloadableSensors.length ? (
          <UnloadableSensors sensorStates={unloadableSensors} />
        ) : null;

        if (!sensorDefinitionsSection && !unloadableSensorsSection) {
          return (
            <Box margin={{top: 32}}>
              <NonIdealState
                icon="automatic-updates"
                title="No sensors found"
                description={
                  <p>
                    This instance does not have any sensors defined. Visit the{' '}
                    <a
                      href="https://docs.dagster.io/overview/schedules-sensors/sensors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      sensor documentation
                    </a>{' '}
                    for more information about setting up sensors in Dagster.
                  </p>
                }
              />
            </Box>
          );
        }

        return (
          <Group direction="column" spacing={32}>
            {sensorDefinitionsSection}
            {unloadableSensorsSection}
          </Group>
        );
      }}
    </Loading>
  );
};
