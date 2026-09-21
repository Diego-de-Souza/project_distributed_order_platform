package com.project.order.domain.model;

import java.util.Objects;

public final class Money {
    private final double value;

    public Money(double value) {
        if (value < 0) {
            throw new IllegalArgumentException("Amount must be greater than or equal to 0");
        }
        this.value = value;
    }

    public static Money of(double value) {
        return new Money(value);
    }

    public static Money zero() {
        return new Money(0);
    }

    public Money add(Money other) {
        return new Money(this.value + other.value);
    }

    public Money multiply(int quantity) {
        return new Money(this.value * quantity);
    }

    public double getValue() {
        return this.value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money)) return false;
        return Double.compare(((Money) o).value, this.value) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.value);
    }

    @Override
    public String toString() {
        return String.valueOf(this.value);
    }
}
