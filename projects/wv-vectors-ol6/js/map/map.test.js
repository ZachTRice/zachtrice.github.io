import { mapParser } from './map';

describe('permalink 1.1', () => {
  test('parses state', () => {
    let errors = [];
    let state = {
      map: '0,1,2,3'
    };
    mapParser(state, errors);

    expect(state.v).toEqual([0, 1, 2, 3]);
    expect(errors).toHaveLength(0);
  });
});

describe('permalink 1.2', () => {
  test('parses state', () => {
    let errors = [];
    let state = {
      v: '0,1,2,3'
    };
    mapParser(state, errors);

    expect(state.v).toEqual([0, 1, 2, 3]);
    expect(errors).toHaveLength(0);
  });

  test('error on invalid extent', () => {
    let errors = [];
    let state = {
      map: '0,1,x,3'
    };
    mapParser(state, errors);

    expect(state.v).toBeFalsy();
    expect(errors).toHaveLength(1);
  });
});
