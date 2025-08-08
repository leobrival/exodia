'use client'

import { parseAsStringEnum, useQueryStates } from 'nuqs'
import { useMemo } from 'react'

// Types pour les paramètres de projets
export type ViewMode = 'card' | 'list'
export type SortBy = 'title' | 'date'
export type SortOrder = 'asc' | 'desc'

// Configuration des paramètres de projets avec nuqs
const projectsParamsConfig = {
  view: parseAsStringEnum<ViewMode>(['card', 'list']).withDefault('card'),
  sortBy: parseAsStringEnum<SortBy>(['title', 'date']).withDefault('date'),
  sortOrder: parseAsStringEnum<SortOrder>(['asc', 'desc']).withDefault('desc'),
}

export function useProjectsParams() {
  const [params, setParams] = useQueryStates(projectsParamsConfig, {
    shallow: false, // Permet de gérer les paramètres côté serveur
  })

  // Fonctions utilitaires pour changer les paramètres
  const setViewMode = (view: ViewMode) => {
    setParams({ view })
  }

  const setSortBy = (sortBy: SortBy) => {
    setParams({ sortBy })
  }

  const setSortOrder = (sortOrder: SortOrder) => {
    setParams({ sortOrder })
  }

  const toggleSortOrder = () => {
    setParams({ sortOrder: params.sortOrder === 'asc' ? 'desc' : 'asc' })
  }

  const setSorting = (sortBy: SortBy, sortOrder: SortOrder) => {
    setParams({ sortBy, sortOrder })
  }

  // État calculé pour l'UI
  const isCardView = params.view === 'card'
  const isListView = params.view === 'list'
  const isSortByTitle = params.sortBy === 'title'
  const isSortByDate = params.sortBy === 'date'
  const isAscending = params.sortOrder === 'asc'
  const isDescending = params.sortOrder === 'desc'

  // Labels pour l'affichage
  const sortLabel = useMemo(() => {
    const sortByLabel = params.sortBy === 'title' ? 'Titre' : 'Date'
    const orderLabel = params.sortOrder === 'asc' ? 'croissant' : 'décroissant'
    return `${sortByLabel} (${orderLabel})`
  }, [params.sortBy, params.sortOrder])

  return {
    // Paramètres bruts
    params,
    setParams,

    // Getters
    viewMode: params.view,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,

    // États booléens
    isCardView,
    isListView,
    isSortByTitle,
    isSortByDate,
    isAscending,
    isDescending,

    // Labels
    sortLabel,

    // Actions
    setViewMode,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    setSorting,
  }
}