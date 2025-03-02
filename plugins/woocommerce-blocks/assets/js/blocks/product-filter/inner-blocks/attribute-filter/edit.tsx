/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import { getSetting } from '@woocommerce/settings';
import {
	useCollection,
	useCollectionData,
} from '@woocommerce/base-context/hooks';
import {
	AttributeSetting,
	AttributeTerm,
	objectHasProp,
} from '@woocommerce/types';
import {
	Disabled,
	Button,
	ToolbarGroup,
	withSpokenMessages,
	Notice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { EditProps, isAttributeCounts } from './types';
import {
	NoAttributesPlaceholder,
	AttributesPlaceholder,
} from './components/placeholder';
import { AttributeSelectControls } from './components/attribute-select-controls';
import { getAttributeFromId } from './utils';
import { Inspector } from './components/inspector-controls';
import { AttributeCheckboxList } from './components/attribute-checkbox-list';
import { AttributeDropdown } from './components/attribute-dropdown';
import './style.scss';

const ATTRIBUTES = getSetting< AttributeSetting[] >( 'attributes', [] );

const Edit = ( props: EditProps ) => {
	const {
		attributes: blockAttributes,
		setAttributes,
		debouncedSpeak,
	} = props;

	const { attributeId, queryType, isPreview, displayStyle, showCounts } =
		blockAttributes;

	const attributeObject = getAttributeFromId( attributeId );

	const [ isEditing, setIsEditing ] = useState(
		! attributeId && ! isPreview
	);
	const [ attributeOptions, setAttributeOptions ] = useState<
		AttributeTerm[]
	>( [] );

	const { results: attributeTerms } = useCollection< AttributeTerm >( {
		namespace: '/wc/store/v1',
		resourceName: 'products/attributes/terms',
		resourceValues: [ attributeObject?.id || 0 ],
		shouldSelect: blockAttributes.attributeId > 0,
		query: { orderby: 'menu_order' },
	} );

	const { results: filteredCounts } = useCollectionData( {
		queryAttribute: {
			taxonomy: attributeObject?.taxonomy || '',
			queryType,
		},
		queryState: {},
		isEditor: true,
	} );

	const blockProps = useBlockProps();

	useEffect( () => {
		const termIdHasProducts =
			objectHasProp( filteredCounts, 'attribute_counts' ) &&
			isAttributeCounts( filteredCounts.attribute_counts )
				? filteredCounts.attribute_counts.map( ( term ) => term.term )
				: [];

		if ( termIdHasProducts.length === 0 ) return setAttributeOptions( [] );

		setAttributeOptions(
			attributeTerms.filter( ( term ) => {
				return termIdHasProducts.includes( term.id );
			} )
		);
	}, [ attributeTerms, filteredCounts ] );

	const Toolbar = () => (
		<BlockControls>
			<ToolbarGroup
				controls={ [
					{
						icon: 'edit',
						title: __( 'Edit', 'woocommerce' ),
						onClick: () => setIsEditing( ! isEditing ),
						isActive: isEditing,
					},
				] }
			/>
		</BlockControls>
	);

	const AttributeSelectPlaceholder = () => (
		<AttributesPlaceholder>
			<div className="wc-block-attribute-filter__selection">
				<AttributeSelectControls
					isCompact={ false }
					attributeId={ attributeId }
					setAttributeId={ ( id ) =>
						setAttributes( {
							attributeId: id,
						} )
					}
				/>
				<Button
					variant="primary"
					onClick={ () => {
						setIsEditing( false );
						debouncedSpeak(
							__(
								'Now displaying a preview of the Filter Products by Attribute block.',
								'woocommerce'
							)
						);
					} }
				>
					{ __( 'Done', 'woocommerce' ) }
				</Button>
			</div>
		</AttributesPlaceholder>
	);

	const Wrapper = ( { children }: { children: React.ReactNode } ) => (
		<div { ...blockProps }>
			<Toolbar />
			{ children }
		</div>
	);

	// Block rendering starts.
	if ( Object.keys( ATTRIBUTES ).length === 0 )
		return (
			<Wrapper>
				<NoAttributesPlaceholder />
			</Wrapper>
		);

	if ( isEditing )
		return (
			<Wrapper>
				<AttributeSelectPlaceholder />
			</Wrapper>
		);

	if ( ! attributeId || ! attributeObject )
		return (
			<Wrapper>
				<Notice status="warning" isDismissible={ false }>
					<p>
						{ __(
							'Please select an attribute to use this filter!',
							'woocommerce'
						) }
					</p>
				</Notice>
			</Wrapper>
		);

	if ( attributeOptions.length === 0 )
		return (
			<Wrapper>
				<Notice status="warning" isDismissible={ false }>
					<p>
						{ __(
							'There are no products with the selected attributes.',
							'woocommerce'
						) }
					</p>
				</Notice>
			</Wrapper>
		);

	return (
		<Wrapper>
			<Inspector { ...props } />
			<Disabled>
				{ displayStyle === 'dropdown' ? (
					<AttributeDropdown
						label={
							attributeObject.label ||
							__( 'attribute', 'woocommerce' )
						}
					/>
				) : (
					<AttributeCheckboxList
						showCounts={ showCounts }
						attributeTerms={ attributeOptions }
					/>
				) }{ ' ' }
			</Disabled>
		</Wrapper>
	);
};

export default withSpokenMessages( Edit );
