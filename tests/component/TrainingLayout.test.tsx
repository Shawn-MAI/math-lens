import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LessonLayout } from '../../src/ui/components/LessonLayout'
import { trainingLesson } from '../fixtures/trainingLesson'

it('dispatches training layouts and updates from real training state in StrictMode', () => {
  render(<StrictMode><LessonLayout lesson={trainingLesson} /></StrictMode>)
  expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent))
    .toEqual(['Intuition', 'Try it', 'Formula', 'Worked example'])
  expect(screen.getByTestId('training-inspection')).toHaveTextContent('18.000000')
  fireEvent.click(screen.getByRole('button', { name: /step forward/i }))
  expect(screen.getByTestId('training-inspection')).toHaveTextContent('11.520000')
  expect(screen.getByTestId('worked-example')).toHaveTextContent('11.520000')
})
