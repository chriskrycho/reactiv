import { describe, expect, it, test, vi } from 'vitest';
import { createEffect } from '../src/effect';
import { createDerived, createSignal } from '../src';
import { createClassifier } from 'typescript';

describe('Effect', () => {
  test('it works', () => {
    let foo = createSignal(0);

    let effectSpy = vi.fn(() => {
      foo.value;
    });

    createEffect(effectSpy);

    expect(effectSpy).toHaveBeenCalledOnce();

    foo.value++;

    expect(effectSpy).toHaveBeenCalledTimes(2);

    foo.value++;

    expect(effectSpy).toHaveBeenCalledTimes(3);
  });

  test('it works with derived values', () => {
    let foo = createSignal('foo');

    let uppercase = createDerived(() => {
      return foo.value.toUpperCase();
    });

    let effectValue = '';

    let effectSpy = vi.fn(() => {
      effectValue = uppercase.value;
    });

    createEffect(effectSpy);

    expect(effectSpy).toHaveBeenCalledOnce();

    foo.value = 'bar';

    expect(effectValue).toEqual('BAR');
    expect(effectSpy).toHaveBeenCalledTimes(2);

    foo.value = 'baz';

    expect(effectValue).toEqual('BAZ');
    expect(effectSpy).toHaveBeenCalledTimes(3);
  });

  // This feature is not implemented and frankly may not even be possible given the other constraints
  // around how effects work. Leaving this test here just in case I figure this out at some point.
  test.skip('it only recomputes when its direct dependencies have actually changed', () => {
    let foo = createSignal(0);

    let isOdd = createDerived(() => {
      return foo.value % 2 !== 0;
    });

    const effectSpy = vi.fn(() => {
      isOdd.value;
    });

    createEffect(effectSpy);

    expect(effectSpy).not.toHaveBeenCalled();

    foo.value = 1;

    expect(effectSpy).toHaveBeenCalledOnce();

    foo.value = 3;

    expect(effectSpy).toHaveBeenCalledOnce();
  });

  test('it works with multiple derived values', () => {
    let firstName = createSignal('john');
    let lastName = createSignal('smith');

    const firstNameUppercase = createDerived(() => {
      return firstName.value.toUpperCase();
    });

    const lastNameUppercase = createDerived(() => {
      return lastName.value.toUpperCase();
    });

    const fullName = createDerived(() => {
      return `${firstNameUppercase.value} ${lastNameUppercase.value}`;
    });

    let effectValue = '';

    const effectSpy = vi.fn(() => {
      effectValue = `Combining ${firstNameUppercase.value} and ${lastNameUppercase.value} to create ${fullName.value}`;
    });

    createEffect(effectSpy);

    expect(effectSpy).toHaveBeenCalledOnce();

    firstName.value = 'jane';

    expect(effectSpy).toHaveBeenCalledTimes(2);

    expect(effectValue).toEqual('Combining JANE and SMITH to create JANE SMITH');
  });

  test('it only recomputes when relevant dependencies have changed', () => {
    let foo = createSignal('foo');
    let bar = createSignal('bar');

    let uppercaseFoo = createDerived(() => {
      return foo.value.toUpperCase();
    });

    let uppercaseBar = createDerived(() => {
      return bar.value.toUpperCase();
    });

    let effectValue = '';

    const effectSpy = vi.fn(() => {
      effectValue = uppercaseBar.value;
    });

    createEffect(effectSpy);

    expect(effectSpy).toHaveBeenCalledOnce();

    foo.value = 'blah';

    expect(effectValue).toEqual('BAR');
    expect(effectSpy).toHaveBeenCalledOnce();

    uppercaseFoo.value;

    expect(effectSpy).toHaveBeenCalledOnce();

    bar.value = 'baz';

    expect(effectSpy).toHaveBeenCalledTimes(2);
    expect(effectValue).toEqual('BAZ');
  });

  it('can dispose', () => {
    let foo = createSignal(0);

    let effectSpy = vi.fn(() => {
      foo.value;
    });

    const dispose = createEffect(effectSpy);

    foo.value++;

    expect(effectSpy).toHaveBeenCalledTimes(2);

    expect(dispose()).to.be.true;

    foo.value++;

    expect(effectSpy).toHaveBeenCalledTimes(2);
  });

  it('prevents you from mutating dependencies inside of an effect in order to prevent cycles', () => {
    let foo = createSignal(0);

    const effectWrapper = () => {
      createEffect(() => {
        foo.value++;
      });

      foo.value++;
    };

    expect(effectWrapper).toThrowError(
      'Cannot update a tag that has been used during a computation.'
    );
  });
});
