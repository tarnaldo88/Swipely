import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ProductCategory, CategoryPreferences } from '../../types';
import { CategoryPreferenceService } from '../../services/CategoryPreferenceService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategorySelectStyles } from '../Styles/ProfileStyles';


interface CategorySelectionScreenProps {
  navigation: any;
  route?: {
    params?: {
      isInitialSetup?: boolean;
    };
  };
}

interface CategoryItem extends ProductCategory {
  selected: boolean;
}

const CategorySelectionScreen: React.FC<CategorySelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isInitialSetup = route?.params?.isInitialSetup || false;

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const availableCategories = await CategoryPreferenceService.getAvailableCategories();
      const userPreferences = await CategoryPreferenceService.getUserPreferences();
      
      const categoriesWithSelection = availableCategories.map(category => ({
        ...category,
        selected: userPreferences.selectedCategories.includes(category.id),
      }));
      
      setCategories(categoriesWithSelection);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, selected: !category.selected }
          : category
      )
    );
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const selectedCategories = categories
        .filter(category => category.selected)
        .map(category => category.id);

      if (selectedCategories.length === 0) {
        Alert.alert('Selection Required', 'Please select at least one category.');
        return;
      }

      const preferences: CategoryPreferences = {
        selectedCategories,
        lastUpdated: new Date(),
      };

      await CategoryPreferenceService.saveUserPreferences(preferences);
      
      if (isInitialSetup) {
        navigation.replace('Main');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: CategoryItem }) => (
    <TouchableOpacity
      style={[
        CategorySelectStyles.categoryItem,
        item.selected && CategorySelectStyles.categoryItemSelected,
      ]}
      onPress={() => toggleCategory(item.id)}
    >
      <Text
        style={[
          CategorySelectStyles.categoryText,
          item.selected && CategorySelectStyles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
      {item.selected && (
        <Text style={CategorySelectStyles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={CategorySelectStyles.container}>
        <View style={CategorySelectStyles.loadingContainer}>
          <Text style={CategorySelectStyles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CategorySelectStyles.container}>
      <View style={CategorySelectStyles.header}>
        <Text style={CategorySelectStyles.title}>
          {isInitialSetup ? 'Choose Your Interests' : 'Update Categories'}
        </Text>
        <Text style={CategorySelectStyles.subtitle}>
          Select categories you're interested in to personalize your product feed
        </Text>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        style={CategorySelectStyles.categoryList}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={CategorySelectStyles.row}
      />

      <View style={CategorySelectStyles.footer}>
        <TouchableOpacity
          style={[
            CategorySelectStyles.saveButton,
            saving && CategorySelectStyles.saveButtonDisabled,
          ]}
          onPress={savePreferences}
          disabled={saving}
        >
          <Text style={CategorySelectStyles.saveButtonText}>
            {saving ? 'Saving...' : isInitialSetup ? 'Get Started' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CategorySelectionScreen;