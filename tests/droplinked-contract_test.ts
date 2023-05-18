import {
	Clarinet,
	Tx,
	Chain,
	Account,
	types,
} from 'https://deno.land/x/clarinet@v1.5.4/index.ts'
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts'
import { uintValue } from './utils/clarity.utils.ts'

Clarinet.test({
	name: 'droplinked:create: should update the maps and return the correct result when creating a new SKU',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'
		const droplinkedProduct = 'product'
		const droplinkedSKU = 'sku'

		const amount = 10000
		const price = 25
		const commission = 50
		const uri = 'ipfs://droplinked'

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		// droplinked:create should return ok response with sku id
		assertEquals(block.receipts[0].result, types.ok(types.uint(1)))

		const createdSkuIdResult = block.receipts[0].result.expectOk()
		const createdSkuId = uintValue(createdSkuIdResult)

		// droplinked:create should emit fungible token mint event
		block.receipts[0].events.expectFungibleTokenMintEvent(
			amount,
			creator.address,
			droplinkedContract + '::' + droplinkedProduct
		)

		// droplinked:create should emit non-fungible token mint event
		block.receipts[0].events.expectNonFungibleTokenMintEvent(
			`{id: ${types.uint(createdSkuId)}, owner: ${creator.address}}`,
			creator.address,
			droplinkedContract,
			droplinkedSKU
		).assetId

		// droplinked:create should emit sft mint event
		block.receipts[0].events.expectPrintEvent(
			droplinkedContract,
			`{amount: ${types.uint(amount)}, recipient: ${
				creator.address
			}, token-id: ${types.uint(createdSkuId)}, type: "sft_mint"}`
		)

		// droplinked:create should update commissions map
		const commissionResult = chain.callReadOnlyFn(
			droplinkedContract,
			'get-commission',
			[types.uint(createdSkuId), types.principal(creator.address)],
			creator.address
		).result
		assertEquals(commissionResult, types.ok(types.some(types.uint(commission))))

		// droplinked:create should update creators map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-creator',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectSome()
			.expectPrincipal(creator.address)

		// droplinked:create should update balances map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-balance',
				[types.uint(createdSkuId), types.principal(creator.address)],
				creator.address
			)
			.result.expectOk()
			.expectUint(amount)

		// droplinked:create should update prices map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-price',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectSome()
			.expectUint(price)

		// droplinked:create should update supplies map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-total-supply',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectUint(amount)

		// droplinked:craete should update uris map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-token-uri',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectSome()
			.expectAscii(uri)

		// droplinked:craete should update last sku id variable
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-last-sku-id',
				[],
				creator.address
			)
			.result.expectOk()
			.expectUint(createdSkuId)
	},
})

Clarinet.test({
	name: 'droplinked:create: should return error when creator is not contract caller',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'

		const amount = 10000
		const price = 25
		const commission = 50
		const uri = 'ipfs://droplinked'

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				deployer.address
			),
		])

		// droplinked:create should return error if creator is not contract caller
		block.receipts[0].result.expectErr().expectUint(101)
	},
})

Clarinet.test({
	name: 'droplinked:create: should return error when amount is 0',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'

		const amount = 0
		const price = 25
		const commission = 50
		const uri = 'ipfs://droplinked'

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		// droplinked:create should return error when amount is 0
		block.receipts[0].result.expectErr().expectUint(300)
	},
})

Clarinet.test({
	name: 'droplinked:create: should return error when price is 0',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'

		const amount = 10000
		const price = 0
		const commission = 50
		const uri = 'ipfs://droplinked'

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		// droplinked:create should return error when price is 0
		block.receipts[0].result.expectErr().expectUint(301)
	},
})

Clarinet.test({
	name: 'droplinked:create: should return error when commission is greater than 100',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'

		const amount = 10000
		const price = 25
		const commission = 101
		const uri = 'ipfs://droplinked'

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		// droplinked:create should return error when commission is greater than 100
		block.receipts[0].result.expectErr().expectUint(303)
	},
})

Clarinet.test({
	name: 'droplinked:create: should return error when uri is empty',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'

		const amount = 10000
		const price = 25
		const commission = 50
		const uri = ''

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		// droplinked:create should return error when uri is empty
		block.receipts[0].result.expectErr().expectUint(302)
	},
})