import { computed } from 'vue'
import { useTenantStore } from '~/stores/tenant'
import { useI18n } from 'vue-i18n'

export type BusinessType =
  | 'RESTAURANT'
  | 'CAFE'
  | 'BAKERY'
  | 'FLOWERS'
  | 'SHOP'
  | 'CLOTHING'
  | 'OTHER'

const FOOD_TYPES: ReadonlySet<BusinessType> = new Set(['RESTAURANT', 'CAFE', 'BAKERY'])
const RETAIL_TYPES: ReadonlySet<BusinessType> = new Set(['FLOWERS', 'SHOP', 'CLOTHING', 'OTHER'])

export const useTerminology = () => {
  const tenantStore = useTenantStore()
  const { t } = useI18n()

  const businessType = computed<BusinessType>(() => {
    return (tenantStore.currentTenant?.businessType as BusinessType) || 'RESTAURANT'
  })

  const isFoodBusiness = computed(() => FOOD_TYPES.has(businessType.value))
  const isRetailBusiness = computed(() => RETAIL_TYPES.has(businessType.value))

  /**
   * Label for the entire collection of items (Menu vs Catalog)
   */
  const catalogLabel = computed(() => {
    if (isFoodBusiness.value) {
      return t('terminology.menu', 'Меню')
    }
    return t('terminology.catalog', 'Каталог')
  })

  /**
   * Label for a single item (Dish vs Product)
   */
  const itemLabel = computed(() => {
    if (isFoodBusiness.value) {
      return t('terminology.dish', 'Блюдо')
    }
    return t('terminology.product', 'Товар')
  })

  /**
   * Plural label for items
   */
  const itemsLabel = computed(() => {
    if (isFoodBusiness.value) {
      return t('terminology.dishes', 'Блюда')
    }
    return t('terminology.products', 'Товары')
  })

  /**
   * Label for item composition (Ingredients vs Attributes/Characteristics)
   */
  const compositionLabel = computed(() => {
    if (isFoodBusiness.value) {
      return t('terminology.ingredients', 'Состав')
    }
    return t('terminology.characteristics', 'Характеристики')
  })

  /**
   * Primary icon for the business type
   */
  const primaryIcon = computed(() => {
    switch (businessType.value) {
      case 'RESTAURANT':
      case 'CAFE':
      case 'BAKERY':
        return 'utensils'
      case 'FLOWERS':
        return 'flower'
      case 'SHOP':
      case 'CLOTHING':
        return 'shopping-bag'
      default:
        return 'package'
    }
  })

  /**
   * Icon for a single item
   */
  const itemIcon = computed(() => {
    if (isFoodBusiness.value) {
      return 'utensils'
    }
    return 'package'
  })

  return {
    businessType,
    isFoodBusiness,
    isRetailBusiness,
    catalogLabel,
    itemLabel,
    itemsLabel,
    compositionLabel,
    primaryIcon,
    itemIcon
  }
}
