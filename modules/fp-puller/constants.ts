export const solutionIO = `
// states
const buttonRef = React.useRef(false);

const [isActive, setIsActive] = React.useState(false);

// policy
const policyIsLeft = capDelay(2000, monoidRetryPolicy.concat(exponentialBackoff(200), limitRetries(5)));

const policyIsRight = capDelay(5000, exponentialBackoff(5000));

// methods
const logDelayIsLeft = (status: RetryStatus) =>
  TE.rightIO(
    log(
      pipe(
        status.previousDelay,
        O.map((delay) => 'retrying in {delay} milliseconds...'),
        O.getOrElse(() => 'First attempt...')
      )
    )
  );

const loDelayIsRight = (status: RetryStatus) =>
  TE.rightIO(
    log(
      pipe(
        status.previousDelay,
        O.map((delay) => 'After {delay} milliseconds...'),
        O.getOrElse(() => 'Start...')
      )
    )
  );

const getSortEntities = (item: string | null): TE.TaskEither<Error, RequestResponse<Person[]>> =>
  pipe(
    buttonRef.current,

    B.fold(
      () => TE.left(new Error('CANCEL')),
      () =>
        Do(TE.taskEither)
          .bind(
            'people',
            pipe(
              TE.tryCatch(
                () => window.fetch(item || REQUEST_URL),
                () => E.toError('Error')
              ),

              TE.chain((peopleRes) =>
                TE.tryCatch<Error, RequestResponse<Person[]>>(() => peopleRes.json(), E.toError)
              )
            )
          )
          .bindL('peopleNextPage', ({ people }) => (people.next ? getSortEntities(people.next) : TE.right(people)))
          .return(({ peopleNextPage, people }) =>
            people.next
              ? { ...peopleNextPage, results: [...people.results, ...peopleNextPage.results] }
              : peopleNextPage
          )
    )
  );

// retry
const firstRetryStep = retrying(
  policyIsRight,
  (status) => pipe(loDelayIsRight(status), TE.apSecond(getSortEntities(null))),
  (e) => E.isRight(e) && !e.right.next
);

const seconRetryStep = retrying(
  policyIsLeft,
  (status) => pipe(logDelayIsLeft(status), TE.apSecond(firstRetryStep)),
  (e) => E.isLeft(e) && e.left.message !== 'CANCEL'
);

const onClickStart = () => {
  buttonRef.current = true;

  setIsActive(true);

  seconRetryStep()
    // eslint-disable-next-line no-console
    .then((res) => console.log('[FINAL RESPONSE]: ', res))
    .finally(() => {
      setIsActive(false);
    });
};

const onCancel = () => {
  buttonRef.current = false;

  setIsActive(false);
};
`;