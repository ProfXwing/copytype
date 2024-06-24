export class Optional<T> {
  private constructor(private value: T | null) { }

  static some<T>(value: T) {
    return new Optional(value);
  }

  static none<T>() {
    return new Optional<T>(null);
  }

  isSome() {
    return this.value !== null;
  }

  isNone() {
    return this.value === null;
  }

  unwrap() {
    if (this.value === null) {
      throw new Error('called `Option.unwrap()` on a `None` value');
    }
    return this.value;
  }

  unwrapOr(defaultValue: T) {
    return this.value === null ? defaultValue : this.value;
  }

  unwrapOrElse(fn: () => T) {
    return this.value === null ? fn() : this.value;
  }
}
